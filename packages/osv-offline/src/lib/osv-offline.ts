import { Ecosystem, Osv, OsvOfflineDb } from '@renovatebot/osv-offline-db';
import { tryDownloadDb } from './download';

export class OsvOffline {
  private osvOfflineDb!: OsvOfflineDb;
  private githubToken?: string;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected constructor(githubToken?: string) {
    this.githubToken = githubToken;
  }

  /**
   * Asynchronous code required as part of class instantiation
   */
  private async initialize(): Promise<void> {
    const result = await tryDownloadDb(this.githubToken);
    if (!result.success) {
      throw result.error;
    }
    this.osvOfflineDb = await OsvOfflineDb.create();
  }

  /**
   * Asynchronously creates a new instance of {@link OsvOffline}
   * @returns A new instance of {@link OsvOffline}
   */
  static async create(githubToken?: string): Promise<OsvOffline> {
    const instance = new OsvOffline(githubToken);
    await instance.initialize();
    return instance;
  }

  /**
   * Query the local database for any package vulnerabilities
   * @param ecosystem The package ecosystem
   * @param packageName The package name
   * @returns An array of {@link Osv.Vulnerability} or an empty array if none are found
   */
  async getVulnerabilities(
    ecosystem: Ecosystem,
    packageName: string
  ): Promise<Osv.Vulnerability[]> {
    return this.osvOfflineDb.query(ecosystem, packageName);
  }
}
