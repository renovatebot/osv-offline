import { OsvOfflineDb } from '@renovatebot/osv-offline-db';
import fs from 'fs-extra';
import path from 'path';
import { tryDownloadDb } from './download';

describe('lib/download', () => {
  describe('tryDownloadDb', () => {
    beforeEach(async () => {
      await fs.remove(OsvOfflineDb.rootDirectory);
    });

    it('works', async () => {
      await expect(tryDownloadDb()).resolves.not.toThrow();
      expect(fs.stat(OsvOfflineDb.rootDirectory)).toBeDefined();
      expect(fs.readdir(OsvOfflineDb.rootDirectory)).not.toBeEmptyArray();
    });

    it('skips download if less than 1 day old', async () => {
      await fs.ensureDir(OsvOfflineDb.rootDirectory);
      const zipFilePath = path.join(
        OsvOfflineDb.rootDirectory,
        'osv-offline.zip'
      );
      await fs.ensureFile(zipFilePath);

      await tryDownloadDb();

      const stat = await fs.stat(zipFilePath);
      expect(stat.size).toBe(0);
    });
  });
});
