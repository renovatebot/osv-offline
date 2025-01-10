import { OsvOfflineDb } from '@redhat-exd-rebuilds/osv-offline-db';
import fs from 'fs-extra';
import { OsvOffline } from './osv-offline';

describe('lib/osv-offline', () => {
  let osvOffline: OsvOffline;

  beforeAll(async () => {
    await fs.remove(OsvOfflineDb.rootDirectory);
    osvOffline = await OsvOffline.create();
  });

  describe('create', () => {
    it('create', async () => {
      await expect(OsvOffline.create()).resolves.not.toThrow();
    });
  });

  describe('getVulnerabilities', () => {
    it('returns empty array for invalid package', async () => {
      const result = await osvOffline.getVulnerabilities(
        'npm',
        'this-package-doesnt-exist'
      );

      expect(result).toBeEmptyArray();
    });
  });

  describe('getContainerVulnerabilities', () => {
    it('returns empty array for invalid package', async () => {
      const result = await osvOffline.getContainerVulnerabilities("quay.io/some/repo");

      expect(result).toBeEmptyArray();
    });
  });
});
