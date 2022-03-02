import { tmpdir } from 'os';
import path from 'path';
import Datastore from '@seald-io/nedb';
import { Ecosystem, ecosystems } from './ecosystem';
import { Vulnerability } from './types';

export { Ecosystem, ecosystems } from './ecosystem';
export * as Osv from './types';

export class OsvOfflineDb {
  public static readonly rootDirectory = path.join(tmpdir(), 'osv-offline');
  private db = {} as Record<Ecosystem, Datastore<Vulnerability>>;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  private async initialize(): Promise<void> {
    for (const ecosystem of ecosystems) {
      this.db[ecosystem] = new Datastore({
        filename: path.join(OsvOfflineDb.rootDirectory, `${ecosystem}.nedb`),
      });
      await this.db[ecosystem].loadDatabaseAsync();
    }
  }

  public static async create(): Promise<OsvOfflineDb> {
    const osvOfflineDb = new OsvOfflineDb();
    await osvOfflineDb.initialize();
    return osvOfflineDb;
  }

  async query(name: string, ecosystem: Ecosystem) {
    return await this.db[ecosystem].findAsync({
      affected: {
        $elemMatch: {
          package: {
            name,
            ecosystem,
            purl: `pkg:${ecosystem.toLowerCase()}/${name}`,
          },
        },
      },
    });
  }
}
