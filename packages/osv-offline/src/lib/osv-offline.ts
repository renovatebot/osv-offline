import { Ecosystem, Osv, OsvOfflineDb } from '@renovatebot/osv-offline-db';
import debug from 'debug';
import { tryDownloadDb } from './download.ts';
import { SplitDownloader } from './split.ts';

const logger = debug('osv-offline:download');

/**
 * Whether the databases are downloaded in the split format, one ecosystem at a time, instead of as one zip.
 */
function useSplitFormat(): boolean {
  return process.env.OSV_OFFLINE_DATABASE_FORMAT?.toLowerCase() === 'split';
}

export class OsvOffline {
  private osvOfflineDb: OsvOfflineDb;
  private readonly splitDownloader = useSplitFormat()
    ? new SplitDownloader()
    : undefined;

  protected constructor() {
    logger('Initializing databases ...');
    this.osvOfflineDb = OsvOfflineDb.create();
    logger('Initializing databases done.');
  }

  /**
   * Asynchronous code required as part of class instantiation
   */
  private static async initialize(): Promise<void> {
    // the split format downloads each ecosystem on its first query
    if (useSplitFormat()) {
      return;
    }
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
    await this.splitDownloader?.ensure(ecosystem);
    return this.osvOfflineDb.query(ecosystem, packageName);
  }

  [Symbol.dispose](): void {
    this.osvOfflineDb?.[Symbol.dispose]();
  }
}
