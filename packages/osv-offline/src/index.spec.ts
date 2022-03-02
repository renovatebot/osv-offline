import { OsvOffline } from '.';

describe('index', () => {
  let osvOffline: OsvOffline;

  beforeAll(async () => {
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
