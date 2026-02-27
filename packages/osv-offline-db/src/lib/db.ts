import fs from 'node:fs/promises';
import { closeSync, createReadStream, existsSync } from 'node:fs';
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

export class OsvOfflineDb {
  private readonly indices: Partial<Record<Ecosystem, EcosystemIndex>> = {};
  private readonly fileHandles: Partial<Record<Ecosystem, fs.FileHandle>> = {};
  public static readonly rootDirectory =
    process.env.OSV_OFFLINE_ROOT_DIR ?? path.join(tmpdir(), 'osv-offline');
  private db: Partial<Record<Ecosystem, Promise<void>>> = {};

  private constructor() {
    process.on('exit', () => {
      this.closeFileHandles();
    });
  }

  private _load(ecosystem: Ecosystem): Promise<void> {
    return (this.db[ecosystem] ??= this._init(ecosystem));
  }

  private async _init(ecosystem: Ecosystem): Promise<void> {
    logger(`Initializing ecosystem '${ecosystem}' ...`);
    const filePath = path.join(
      OsvOfflineDb.rootDirectory,
      `${ecosystem.toLowerCase()}.nedb`
    );

    // no equivalent on fs/promises
    if (!existsSync(filePath)) {
      logger(`Missing data for ecosystem '${ecosystem}'`);
      return;
    }

    this.fileHandles[ecosystem] = await fs.open(filePath, 'r');
    this.indices[ecosystem] = new Map();

    await this._buildIndex(this.indices[ecosystem], filePath);
    logger(`Initializing ecosystem '${ecosystem}' done.`);
  }

  private async _buildIndex(
    index: EcosystemIndex,
    filePath: string
  ): Promise<void> {
    const fileStream = createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let currentOffset = 0;
    const affectedPackageNames = new Set<string>();

    for await (const line of rl) {
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
    await this._load(ecosystem);

    const handle = this.fileHandles[ecosystem];
    const pointers = this.indices[ecosystem]?.get(packageName);

    if (!handle || !pointers || pointers.length === 0) {
      return [];
    }

    const candidates = await Promise.all(
      pointers.map(async ({ offset, length }) => {
        const buffer = Buffer.allocUnsafe(length);
        const { bytesRead } = await handle.read(buffer, 0, length, offset);
        return JSON.parse(
          buffer.toString('utf8', 0, bytesRead)
        ) as Vulnerability;
      })
    );

    const targetPurl = packageToPurl(ecosystem, packageName);
    return candidates.filter((vuln) =>
      vuln.affected?.some(
        (a) =>
          a.package?.name === packageName &&
          a.package.ecosystem === ecosystem &&
          a.package.purl === targetPurl
      )
    );
  }

  private closeFileHandles(): void {
    for (const h of Object.values(this.fileHandles)) {
      try {
        closeSync(h.fd);
      } catch {
        // Ignore errors on close
      }
    }
  }
}
