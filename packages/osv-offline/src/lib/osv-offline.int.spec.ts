import { OsvOfflineDb } from '@renovatebot/osv-offline-db';
import fs from 'fs-extra';
import { OsvOffline } from './osv-offline';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import path from 'path';
import { tmpdir } from 'os';

describe('packages/osv-offline/src/lib/osv-offline.int', () => {
  let osvOffline: OsvOffline;
  let tempDirPath: string;

  beforeAll(async () => {
    tempDirPath = await fs.mkdtemp(path.join(tmpdir(), 'osv-offline_'));
    vi.spyOn(OsvOfflineDb, 'rootDirectory', 'get').mockReturnValue(tempDirPath);
    await fs.remove(OsvOfflineDb.rootDirectory);
    osvOffline = await OsvOffline.create();
  });

  afterAll(async () => {
    await fs.rm(tempDirPath, { force: true, recursive: true });
  });

  describe('create', () => {
    it('create', async () => {
      await expect(OsvOffline.create()).resolves.not.toThrow();
    });
  });

  describe('getVulnerabilities', () => {
    it('works', async () => {
      const result = await osvOffline.getVulnerabilities('npm', 'lodash');

      expect(result).not.toBe([]);
    });

    it('returns empty array for invalid package', async () => {
      const result = await osvOffline.getVulnerabilities(
        'npm',
        'this-package-doesnt-exist'
      );

      expect(result).toEqual([]);
    });
  });
});
