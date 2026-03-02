import { OsvOffline } from './osv-offline';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'fs-extra';
import { OsvOfflineDb } from '@renovatebot/osv-offline-db';

describe('packages/osv-offline/src/lib/osv-offline.int', () => {
  let osvOffline: OsvOffline;

  beforeAll(async () => {
    osvOffline = await OsvOffline.create();
  });

  afterAll(async () => {
    osvOffline[Symbol.dispose]();
    await fs.rm(OsvOfflineDb.rootDirectory, { recursive: true, force: true });
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
