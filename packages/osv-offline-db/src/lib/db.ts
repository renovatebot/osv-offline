import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import readline from 'node:readline';
import { Ecosystem } from './ecosystem';
import type { Vulnerability } from './osv';
import { packageToPurl } from './purl-helper';
import debug from 'debug';

const logger = debug('osv-offline:db');

interface RecordPointer {
  readonly offset: number;
  readonly length: number;
}

type EcosystemIndex = Map<string, RecordPointer[]>;

interface EcosystemData {
  handle: fs.FileHandle;
  index: EcosystemIndex;
  ac: AbortController;
  mtime: number;
}

export class OsvOfflineDb {
  private disposed = false;
  public static readonly rootDirectory =
    process.env.OSV_OFFLINE_ROOT_DIR ?? path.join(tmpdir(), 'osv-offline');

  private _data: Partial<Record<Ecosystem, EcosystemData>> = {};
  private _db: Partial<Record<Ecosystem, Promise<EcosystemData | null>>> = {};

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
      const filePath = path.join(
        OsvOfflineDb.rootDirectory,
        `${ecosystem.toLowerCase()}.nedb`
      );
      const stat = await fs.stat(filePath).catch(() => null);

      // Check if the data currently in memory is still the same object we checked against
      // If not, another request has already handled the reload/unload.
      if (this._data[ecosystem] !== cached) {
        return (this._db[ecosystem] ??= this._init(ecosystem));
      }

      if (stat?.mtimeMs !== cached.mtime) {
        logger(
          stat
            ? `File changed for ecosystem '${ecosystem}', reloading ...`
            : `File removed for ecosystem '${ecosystem}', unloading ...`
        );
        // Delete references synchronously BEFORE the async unload
        // to prevent concurrent callers from picking up stale data
        delete this._data[ecosystem];
        delete this._db[ecosystem];
        await this._unload(cached);
      }
    }

    return (this._db[ecosystem] ??= this._init(ecosystem));
  }

  private async _init(ecosystem: Ecosystem): Promise<EcosystemData | null> {
    logger(`Initializing ecosystem '${ecosystem}' ...`);
    const filePath = path.join(
      OsvOfflineDb.rootDirectory,
      `${ecosystem.toLowerCase()}.nedb`
    );

    const stat = await fs.stat(filePath).catch(() => null);
    if (!stat) {
      logger(`Missing data for ecosystem '${ecosystem}'`);
      delete this._db[ecosystem];
      return null;
    }

    const data: EcosystemData = {
      handle: await fs.open(filePath, 'r'),
      index: new Map(),
      ac: new AbortController(),
      mtime: stat.mtimeMs,
    };

    await this._buildIndex(data, filePath);

    if (data.ac.signal.aborted) {
      logger(`Initializing ecosystem '${ecosystem}' aborted.`);
      await this._unload(data);
      delete this._db[ecosystem];
      return null;
    }

    this._data[ecosystem] = data;
    logger(`Initializing ecosystem '${ecosystem}' done.`);

    return data;
  }

  private async _buildIndex(
    data: EcosystemData,
    filePath: string
  ): Promise<void> {
    const { index, ac } = data;
    const fileStream = createReadStream(filePath);
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

              let pointers = index.get(packageName);
              if (!pointers) {
                pointers = [];
                index.set(packageName, pointers);
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
        const { bytesRead } = await data.handle.read(buffer, 0, length, offset);
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

  private _disposeCore(): Promise<void[]> {
    if (this.disposed) return Promise.resolve([]);
    logger(`Disposing databases ...`);
    this.disposed = true;
    process.off('exit', this._exitHandler);

    const promises = Object.values(this._data).map((d) => this._unload(d));
    this._db = {};
    this._data = {};
    return Promise.all(promises);
  }

  [Symbol.dispose](): void {
    void this._disposeCore();
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this._disposeCore();
  }

  private async _unload(d: EcosystemData): Promise<void> {
    d.ac.abort();
    try {
      await d.handle.close();
    } catch {
      // ignore
    }
  }
}
