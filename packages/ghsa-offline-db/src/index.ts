import { tmpdir } from 'os';
import path from 'path';
import { Connection, Repository, createConnection } from 'typeorm';
import { Package } from './entity/package';
import { Vulnerability } from './entity/vulnerability';
import { PackageRepository } from './repository/package-repository';

export const dbFileName = 'ghsa.sqlite';
export const dbDirectory = path.join(tmpdir(), 'ghsa-offline');
export const dbPath = path.join(dbDirectory, 'ghsa.sqlite');

export { Package, Ecosystem } from './entity/package';
export { Vulnerability } from './entity/vulnerability';

export class GhsaOfflineDb {
  private connection!: Connection;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  private async initialize(): Promise<void> {
    this.connection = await createConnection({
      type: 'better-sqlite3',
      synchronize: true,
      database: dbPath,
      entities: [Package, Vulnerability],
    });
  }

  public static async create(): Promise<GhsaOfflineDb> {
    const ghsaOfflineDb = new GhsaOfflineDb();
    await ghsaOfflineDb.initialize();
    return ghsaOfflineDb;
  }

  get packageRepository(): PackageRepository {
    return this.connection.getCustomRepository(PackageRepository);
  }

  get vulnerabilityRepository(): Repository<Vulnerability> {
    return this.connection.getRepository(Vulnerability);
  }
}
