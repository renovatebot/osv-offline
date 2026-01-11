import fs from 'node:fs/promises';
import { closeSync, createReadStream, existsSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import readline from 'node:readline';
import { Ecosystem, ecosystems } from './ecosystem';
import type { Vulnerability } from './osv';
import { packageToPurl } from './purl-helper';

interface RecordPointer {
  readonly offset: number;
  readonly length: number;
}

type EcosystemIndex = Map<string, RecordPointer[]>;

export class OsvOfflineDb {
  private readonly indices: Record<string, EcosystemIndex> = {};
  private readonly fileHandles: Record<string, fs.FileHandle> = {};
  public static readonly rootDirectory =
    process.env.OSV_OFFLINE_ROOT_DIR ?? path.join(tmpdir(), 'osv-offline');

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static async create(): Promise<OsvOfflineDb> {
    const instance = new OsvOfflineDb();
    await instance.initialize();
    return instance;
  }

  private async initialize(): Promise<void> {
    for (const ecosystem of ecosystems) {
      const filePath = path.join(
        OsvOfflineDb.rootDirectory,
        `${ecosystem.toLowerCase()}.nedb`
      );

      if (!existsSync(filePath)) {
        continue;
      }

      this.fileHandles[ecosystem] = await fs.open(filePath, 'r');
      this.indices[ecosystem] = new Map();

      await this.buildIndex(this.indices[ecosystem], filePath);
    }

    process.on('exit', () => {
      this.closeFileHandles();
    });
  }

  private async buildIndex(
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

  async query(
    ecosystem: Ecosystem,
    packageName: string
  ): Promise<Vulnerability[]> {
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

  public closeFileHandles(): void {
    for (const h of Object.values(this.fileHandles)) {
      try {
        closeSync(h.fd);
      } catch {
        // Ignore errors on close
      }
    }
  }
}
