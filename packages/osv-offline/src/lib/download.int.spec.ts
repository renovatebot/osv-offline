import { OsvOfflineDb } from '@renovatebot/osv-offline-db';
import fs from 'fs-extra';
import path from 'path';
import { tryDownloadDb } from './download';
import { describe, expect, it } from 'vitest';

describe('packages/osv-offline/src/lib/download.int', () => {
  describe('tryDownloadDb', () => {
    it('works', async () => {
      const result = await tryDownloadDb();

      expect(result.success).toBe(true);
      expect(fs.stat(OsvOfflineDb.rootDirectory)).toBeDefined();
      expect(fs.readdir(OsvOfflineDb.rootDirectory)).not.toEqual([]);
    });

    it('skips download if less than 1 day old', async () => {
      await fs.ensureDir(OsvOfflineDb.rootDirectory);
      const zipFilePath = path.join(
        OsvOfflineDb.rootDirectory,
        'osv-offline.zip'
      );
      await fs.writeFile(zipFilePath, Buffer.from([]));

      const result = await tryDownloadDb();

      expect(result.success).toEqual(true);
      const stat = await fs.stat(zipFilePath);
      expect(stat.size).toBe(0);

      await fs.rm(zipFilePath);
    });
  });
});
