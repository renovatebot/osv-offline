import { OsvOfflineDb } from '@renovatebot/osv-offline-db';
import fs from 'fs-extra';
import path from 'path';
import { tryDownloadDb } from './download';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

describe('packages/osv-offline/src/lib/download.int', () => {
  describe('tryDownloadDb', () => {
    afterAll(async () => {
      await fs.rm(OsvOfflineDb.rootDirectory, { recursive: true, force: true });
    });

    beforeEach(() => {
      delete process.env.OSV_OFFLINE_DISABLE_DOWNLOAD;
    });
    afterAll(async () => {
      const zipFilePath = path.join(
        OsvOfflineDb.rootDirectory,
        'osv-offline.zip'
      );
      await fs.rm(zipFilePath);
    });

    it('works', async () => {
      const result = await tryDownloadDb();

      expect(result.success).toBe(true);
      expect(fs.stat(OsvOfflineDb.rootDirectory)).toBeDefined();
      expect(fs.readdir(OsvOfflineDb.rootDirectory)).not.toEqual([]);
    });

    it('skips if it should skip', async () => {
      process.env.OSV_OFFLINE_DISABLE_DOWNLOAD = 'true';
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
    });
  });
});
