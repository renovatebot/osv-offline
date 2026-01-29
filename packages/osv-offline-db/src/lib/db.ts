import { tmpdir } from 'os';
import path from 'path';
import Datastore from '@seald-io/nedb';
import { Ecosystem, ecosystems } from './ecosystem';
import type { Vulnerability } from './osv';
import type { Osv } from '..';
import { packageToPurl } from './purl-helper';

export class OsvOfflineDb {
  public static readonly rootDirectory =
    process.env.OSV_OFFLINE_ROOT_DIR ?? path.join(tmpdir(), 'osv-offline');
  private db = {} as Record<Ecosystem, Datastore<Vulnerability>>;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  private async initialize(): Promise<void> {
    for (const ecosystem of ecosystems) {
      this.db[ecosystem] = new Datastore({
        filename: path.join(
          OsvOfflineDb.rootDirectory,
          `${ecosystem.toLowerCase()}.nedb`
        ),
      });
      await this.db[ecosystem].loadDatabaseAsync();
    }
  }

  public static async create(): Promise<OsvOfflineDb> {
    const osvOfflineDb = new OsvOfflineDb();
    await osvOfflineDb.initialize();
    return osvOfflineDb;
  }

  private static escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
  }

  async query(
    ecosystem: Ecosystem,
    packageName: string
  ): Promise<Osv.Vulnerability[]> {
    return await this.db[ecosystem].findAsync({
      affected: {
        $elemMatch: {
          'package.name': packageName,
          'package.ecosystem': new RegExp(
            `^${OsvOfflineDb.escapeRegExp(ecosystem)}($|:)`
          ),
          'package.purl': packageToPurl(ecosystem, packageName),
        },
      },
    });
  }
}
