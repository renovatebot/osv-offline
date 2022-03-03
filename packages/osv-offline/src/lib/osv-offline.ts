import { Osv, OsvOfflineDb } from '@jamiemagee/osv-offline-db';
import { tryDownloadDb } from './download';

export class OsvOffline {
  private osvOfflineDb!: OsvOfflineDb;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  private async initialize(): Promise<void> {
    const success = await tryDownloadDb();
    if (!success) {
      throw new Error();
    }
    this.osvOfflineDb = await OsvOfflineDb.create();
  }

  static async create(): Promise<OsvOffline> {
    const instance = new OsvOffline();
    await instance.initialize();
    return instance;
  }

  async getNpmPackage(name: string): Promise<Osv.Vulnerability[]> {
    return await this.osvOfflineDb.query(name, 'npm');
  }
}
