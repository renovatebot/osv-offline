import { tmpdir } from 'os';
import path from 'path';
import Datastore from '@seald-io/nedb';
import { Ecosystem, ecosystems } from './ecosystem';
import type { Vulnerability } from './osv';
import type { Osv } from '..';
import { packageToPurl } from './purl-helper';
import debug from 'debug';

const logger = debug('osv-offline:db');

export class OsvOfflineDb {
  public static readonly rootDirectory =
    process.env.OSV_OFFLINE_ROOT_DIR ?? path.join(tmpdir(), 'osv-offline');
  private db = {} as Record<Ecosystem, Promise<Datastore<Vulnerability>>>;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  private _load(ecosystem: Ecosystem): Promise<Datastore<Vulnerability>> {
    return (this.db[ecosystem] ??= this._init(ecosystem));
  }
  private async _init(ecosystem: Ecosystem): Promise<Datastore<Vulnerability>> {
    if (!ecosystems.includes(ecosystem)) {
      throw new Error(`Ecosystem not supported`);
    }
    logger(`Initializing database for ecosystem: ${ecosystem}`);
    const db = new Datastore({
      filename: path.join(
        OsvOfflineDb.rootDirectory,
        `${ecosystem.toLowerCase()}.nedb`
      ),
    });
    await db.loadDatabaseAsync();

    return db;
  }

  public static create(): OsvOfflineDb {
    const osvOfflineDb = new OsvOfflineDb();
    return osvOfflineDb;
  }

  async query(
    ecosystem: Ecosystem,
    packageName: string
  ): Promise<Osv.Vulnerability[]> {
    return await (
      await this._load(ecosystem)
    ).findAsync({
      affected: {
        $elemMatch: {
          package: {
            name: packageName,
            ecosystem,
            purl: packageToPurl(ecosystem, packageName),
          },
        },
      },
    });
  }
}
