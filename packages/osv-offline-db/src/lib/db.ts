import fs from 'node:fs/promises';
import {
  WatchEventType,
  closeSync,
  createReadStream,
  existsSync,
  watch,
} from 'node:fs';
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

interface ValidData {
  valid: true;
  handle: fs.FileHandle;
  index: EcosystemIndex;
  ac: AbortController;
}

interface InvalidData {
  valid: false;
  handle?: never;
  index?: never;
  ac?: never;
}

type EcosystemData = ValidData | InvalidData;

export class OsvOfflineDb {
  private disposed = false;
  private watching = false;
  private abort = new AbortController();
  public static readonly rootDirectory =
    process.env.OSV_OFFLINE_ROOT_DIR ?? path.join(tmpdir(), 'osv-offline');

  private _data: Partial<Record<Ecosystem, ValidData>> = {};
  private _db: Partial<Record<Ecosystem, Promise<EcosystemData>>> = {};

  private constructor() {
    process.on('exit', () => {
      this[Symbol.dispose]();
    });
  }

  private _load(ecosystem: Ecosystem): Promise<EcosystemData> {
    return (this._db[ecosystem] ??= this._init(ecosystem));
  }

  private _watch(ev: WatchEventType, file: string | null): void {
    // v8 ignore if -- hard to test
    if (this.abort.signal.aborted) {
      return;
    }
    const m = /(:?^|\/)(?<ecosystem>[a-z]+)\.nedb/.exec(file ?? '');
    if (!m?.groups?.ecosystem) {
      // ignore other files
      return;
    }
    const ecosystem = m.groups.ecosystem as Ecosystem;

    const data = this._data[ecosystem];
    if (!data) {
      // data not loaded
      return;
    }

    logger(`Unloading database '${ecosystem}' for file '${file}' (${ev}) ...`);
    this._unload(data);
    delete this._data[ecosystem];
    delete this._db[ecosystem];
  }

  private async _init(ecosystem: Ecosystem): Promise<EcosystemData> {
    logger(`Initializing ecosystem '${ecosystem}' ...`);
    const filePath = path.join(
      OsvOfflineDb.rootDirectory,
      `${ecosystem.toLowerCase()}.nedb`
    );

    // no equivalent on fs/promises
    if (!existsSync(filePath)) {
      logger(`Missing data for ecosystem '${ecosystem}'`);
      return { valid: false };
    }

    // only watch if path exists
    if (!this.watching) {
      this.watching = true;
      watch(
        OsvOfflineDb.rootDirectory,
        {
          signal: this.abort.signal,
          recursive: true,
        },
        (e, f) => this._watch(e, f)
      );
    }

    const data: ValidData = {
      valid: true,
      handle: await fs.open(filePath, 'r'),
      index: new Map(),
      ac: new AbortController(),
    };

    await this._buildIndex(data, filePath);

    if (data.ac.signal.aborted) {
      logger(`Initializing ecosystem '${ecosystem}' aborted.`);
      return { valid: false };
    }

    this._data[ecosystem] = data;
    logger(`Initializing ecosystem '${ecosystem}' done.`);

    return data;
  }

  private async _buildIndex(data: ValidData, filePath: string): Promise<void> {
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
        // skip futher initialization
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
    const { valid, index, handle, ac } = await this._load(ecosystem);

    if (!valid || ac.signal.aborted) {
      return [];
    }

    const pointers = index.get(packageName);

    if (!pointers || pointers.length === 0) {
      return [];
    }

    const candidates = await Promise.allSettled(
      pointers.map(async ({ offset, length }) => {
        const buffer = Buffer.allocUnsafe(length);
        const { bytesRead } = await handle.read(buffer, 0, length, offset);
        return JSON.parse(
          buffer.toString('utf8', 0, bytesRead)
        ) as Vulnerability;
      })
    );

    // TODO: throw?
    if (ac.signal.aborted || candidates.some((c) => c.status !== 'fulfilled'))
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
    if (this.disposed) return;
    logger(`Disposing databases ...`);
    this.disposed = true;
    this.abort.abort();

    for (const d of Object.values(this._data)) {
      this._unload(d);
    }
    this._db = {};
    this._data = {};
  }

  private _unload(d: ValidData) {
    try {
      d.ac.abort(); // abort any loading
      closeSync(d.handle.fd);
    } catch {
      // Ignore errors on close
    }
  }
}
