import { OsvOfflineDb } from '@jamiemagee/osv-offline-db';
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

  describe('getNpmPackage', () => {
    it('works', async () => {
      const result = await osvOffline.getNpmPackage('lodash');

      expect(result).not.toBeEmptyArray();
    });
  });
});
