import { Ecosystem, Osv, OsvOfflineDb } from '@renovatebot/osv-offline-db';
import { tryDownloadDb } from './download';
import debug from 'debug';

const logger = debug('osv-offline:download');

export class OsvOffline {
  private osvOfflineDb: OsvOfflineDb;

  protected constructor() {
    logger('Initializing databases ...');
    this.osvOfflineDb = OsvOfflineDb.create();
    logger('Initializing databases done.');
  }

  /**
   * Asynchronous code required as part of class instantiation
   */
  private static async initialize(): Promise<void> {
    const result = await tryDownloadDb();
    if (!result.success) {
      throw result.error;
    }
  }

  /**
   * Asynchronously creates a new instance of {@link OsvOffline}
   * @returns A new instance of {@link OsvOffline}
   */
  static async create(): Promise<OsvOffline> {
    await OsvOffline.initialize();
    const instance = new OsvOffline();
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

  [Symbol.dispose](): void {
    this.osvOfflineDb?.[Symbol.dispose]();
  }
}
