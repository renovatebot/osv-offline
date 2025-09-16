import { OsvOfflineDb } from '@renovatebot/osv-offline-db';
import fs from 'fs-extra';
import path from 'path';
import { tryDownloadDb } from './download';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { tmpdir } from 'os';

describe('packages/osv-offline/src/lib/download.int', () => {
  describe('tryDownloadDb', () => {
    const tempDirList: string[] = [];

    beforeEach(async () => {
      const tempDirPath = await fs.mkdtemp(path.join(tmpdir(), 'osv-offline_'));
      tempDirList.push(tempDirPath);
      vi.spyOn(OsvOfflineDb, 'rootDirectory', 'get').mockReturnValue(
        tempDirPath
      );
      await fs.remove(OsvOfflineDb.rootDirectory);
    });

    afterAll(async () => {
      // delete all temp directories previously stored in an array
      const pathsToDelete = tempDirList.map((tmpPath) =>
        fs.rm(tmpPath, { recursive: true, force: true })
      );
      await Promise.all(pathsToDelete);
    });

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
      await fs.ensureFile(zipFilePath);

      const result = await tryDownloadDb();

      expect(result.success).toEqual(true);
      const stat = await fs.stat(zipFilePath);
      expect(stat.size).toBe(0);
    });
  });
});
