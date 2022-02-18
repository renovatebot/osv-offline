import { tryDownloadDb } from './download';
import { Ecosystem, GhsaOfflineDb, Package } from '@jamiemagee/ghsa-offline-db';

export class GhsaOffline {
  private ghsaOfflineDb!: GhsaOfflineDb;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  static async create() {
    const instance = new GhsaOffline();
    await instance.initialize();
    return instance;
  }

  private async initialize() {
    await tryDownloadDb();
    this.ghsaOfflineDb = await GhsaOfflineDb.create();
  }

  private prepareQuery(
    ecosystem: Ecosystem,
    packageName: string
  ): Promise<Package | undefined> {
    return this.ghsaOfflineDb.packageRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.vulnerabilities', 'v')
      .where('p.ecosystem = :ecosystem', { ecosystem })
      .where('p.packageName = :packageName', { packageName })
      .getOne();
  }

  getComposerPackage(packageName: string): Promise<Package | undefined> {
    return this.prepareQuery('COMPOSER', packageName);
  }

  getGoPackage(packageName: string): Promise<Package | undefined> {
    return this.prepareQuery('GO', packageName);
  }

  getMavenPackage(packageName: string): Promise<Package | undefined> {
    return this.prepareQuery('MAVEN', packageName);
  }

  getNpmPackage(packageName: string): Promise<Package | undefined> {
    return this.prepareQuery('NPM', packageName);
  }

  getNugetPackage(packageName: string): Promise<Package | undefined> {
    return this.prepareQuery('NUGET', packageName);
  }

  getPipPackage(packageName: string): Promise<Package | undefined> {
    return this.prepareQuery('PIP', packageName);
  }

  getRubyGemsPackage(packageName: string): Promise<Package | undefined> {
    return this.prepareQuery('RUBYGEMS', packageName);
  }

  getRustPackage(packageName: string): Promise<Package | undefined> {
    return this.prepareQuery('RUST', packageName);
  }
}
