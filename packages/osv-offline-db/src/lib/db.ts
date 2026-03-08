import { stat } from 'node:fs/promises';
import { closeSync, createReadStream, read as fsRead, openSync } from 'node:fs';
import { promisify } from 'node:util';
import path from 'node:path';
import { tmpdir } from 'node:os';
import readline from 'node:readline';
import { Ecosystem } from './ecosystem';
import type { Vulnerability } from './osv';
import { packageToPurl } from './purl-helper';
import debug from 'debug';

const logger = debug('osv-offline:db');
const readAsync = promisify(fsRead);

interface RecordPointer {
  readonly offset: number;
  readonly length: number;
}

type EcosystemIndex = Map<string, RecordPointer[]>;

interface EcosystemData {
  filePath: string;
  fd: number;
  index: EcosystemIndex;
  mtime: number;
}

export class OsvOfflineDb {
  private disposed = false;
  public static readonly rootDirectory =
    process.env.OSV_OFFLINE_ROOT_DIR ?? path.join(tmpdir(), 'osv-offline');

  private _data: Partial<Record<Ecosystem, EcosystemData>> = {};
  private _db: Partial<Record<Ecosystem, Promise<EcosystemData | null>>> = {};
  private _pendingAcs = new Set<AbortController>();

  private readonly _exitHandler = () => {
    if (this.disposed) {
      return;
    }
    logger('Databases are not disposed! Please explicitly dispose.');
    this[Symbol.dispose]();
  };

  private constructor() {
    process.on('exit', this._exitHandler);
  }

  private async _load(ecosystem: Ecosystem): Promise<EcosystemData | null> {
    const cached = this._data[ecosystem];
    if (cached) {
      const fileStat = await stat(cached.filePath).catch(() => null);

      // Check if the data currently in memory is still the same object we checked against
      // If not, another request has already handled the reload/unload
      if (this._data[ecosystem] !== cached) {
        return (this._db[ecosystem] ??= this._init(ecosystem));
      }

      if (fileStat?.mtimeMs !== cached.mtime) {
        logger(
          fileStat
            ? `File changed for ecosystem '${ecosystem}', reloading ...`
            : `File removed for ecosystem '${ecosystem}', unloading ...`
        );
        // Delete references before unloading to prevent concurrent callers from picking up stale data
        delete this._data[ecosystem];
        delete this._db[ecosystem];
        this._unload(cached);
      }
    }

    return (this._db[ecosystem] ??= this._init(ecosystem));
  }

  private async _init(ecosystem: Ecosystem): Promise<EcosystemData | null> {
    logger(`Initializing ecosystem '${ecosystem}' ...`);
    const ac = new AbortController();
    this._pendingAcs.add(ac);

    try {
      const filePath = path.join(
        OsvOfflineDb.rootDirectory,
        `${ecosystem.toLowerCase()}.nedb`
      );

      const fileStat = await stat(filePath).catch(() => null);
      if (!fileStat) {
        logger(`Missing data for ecosystem '${ecosystem}'`);
        delete this._db[ecosystem];
        return null;
      }

      const data: EcosystemData = {
        filePath,
        fd: openSync(filePath, 'r'),
        index: new Map(),
        mtime: fileStat.mtimeMs,
      };

      await this._buildIndex(ac, data);

      if (ac.signal.aborted) {
        logger(`Initializing ecosystem '${ecosystem}' aborted.`);
        delete this._db[ecosystem];
        this._unload(data);
        return null;
      }

      this._data[ecosystem] = data;
      logger(`Initializing ecosystem '${ecosystem}' done.`);

      return data;
    } finally {
      this._pendingAcs.delete(ac);
    }
  }

  private async _buildIndex(
    ac: AbortController,
    data: EcosystemData
  ): Promise<void> {
    const fileStream = createReadStream(data.filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let currentOffset = 0;
    const affectedPackageNames = new Set<string>();

    for await (const line of rl) {
      if (ac.signal.aborted) {
        fileStream.destroy();
        return;
      }
      const lineByteLength = Buffer.byteLength(line, 'utf8');

      try {
        const record = JSON.parse(line) as Vulnerability;
        if (record.affected) {
          for (const affected of record.affected) {
            const packageName = affected.package?.name;

            if (packageName && !affectedPackageNames.has(packageName)) {
              affectedPackageNames.add(packageName);

              let pointers = data.index.get(packageName);
              if (!pointers) {
                pointers = [];
                data.index.set(packageName, pointers);
              }
              pointers.push({ offset: currentOffset, length: lineByteLength });
            }
          }
          affectedPackageNames.clear();
        }
      } catch {
        // Skip malformed lines
      }
      currentOffset += lineByteLength + 1;
    }
  }

  public static create(): OsvOfflineDb {
    const osvOfflineDb = new OsvOfflineDb();
    return osvOfflineDb;
  }

  async query(
    ecosystem: Ecosystem,
    packageName: string
  ): Promise<Vulnerability[]> {
    if (this.disposed) {
      throw new Error('Database disposed');
    }
    const data = await this._load(ecosystem);

    if (!data) {
      return [];
    }

    const pointers = data.index.get(packageName);

    if (!pointers || pointers.length === 0) {
      return [];
    }

    const candidates = await Promise.allSettled(
      pointers.map(async ({ offset, length }) => {
        const buffer = Buffer.allocUnsafe(length);
        const { bytesRead } = await readAsync(
          data.fd,
          buffer,
          0,
          length,
          offset
        );
        return JSON.parse(
          buffer.toString('utf8', 0, bytesRead)
        ) as Vulnerability;
      })
    );

    if (this.disposed || candidates.some((c) => c.status !== 'fulfilled'))
      return [];

    const targetPurl = packageToPurl(ecosystem, packageName);
    return candidates
      .filter((c) => c.status === 'fulfilled')
      .map((c) => c.value)
      .filter((vuln) =>
        vuln.affected?.some(
          (a) =>
            a.package?.name === packageName &&
            a.package.ecosystem === ecosystem &&
            a.package.purl === targetPurl
        )
      );
  }

  [Symbol.dispose](): void {
    if (this.disposed) {
      return;
    }
    logger(`Disposing databases ...`);
    this.disposed = true;
    process.off('exit', this._exitHandler);

    for (const ac of this._pendingAcs) {
      ac.abort();
    }
    this._pendingAcs.clear();

    for (const d of Object.values(this._data)) {
      this._unload(d);
    }
    this._db = {};
    this._data = {};
  }

  private _unload(d: EcosystemData): void {
    try {
      closeSync(d.fd);
    } catch {
      // ignore
    }
  }
}
