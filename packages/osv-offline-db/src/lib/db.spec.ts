import { OsvOfflineDb } from './db';
import fs from 'fs-extra';
import path from 'path';
import { Vulnerability } from './osv';

describe('lib/db', () => {
  let osvOfflineDb: OsvOfflineDb;

  const sampleVuln: Vulnerability & { _id: string } = {
    id: 'GHSA-7jfh-2xc9-ccv7',
    summary: 'Cross-Site Scripting in public',
    details:
      'All versions of `public` are vulnerable to stored cross-site scripting (XSS). \n\n\n## Recommendation\n\nNo fix is currently available for this vulnerability. It is our recommendation to not install or use this module at this time.',
    modified: '2020-08-31T18:29:45Z',
    published: '2019-05-31T23:46:40Z',
    database_specific: {
      cwe_ids: ['CWE-79'],
      severity: 'LOW',
      github_reviewed: true,
    },
    references: [
      { type: 'WEB', url: 'https://hackerone.com/reports/316346' },
      { type: 'WEB', url: 'https://www.npmjs.com/advisories/609' },
    ],
    affected: [
      {
        package: { name: 'public', ecosystem: 'npm', purl: 'pkg:npm/public' },
        ranges: [
          { type: 'SEMVER', events: [{ introduced: '0' }, { fixed: '0.1.4' }] },
        ],
        database_specific: {
          source:
            'https://github.com/github/advisory-database/blob/main/advisories/github-reviewed/2019/05/GHSA-7jfh-2xc9-ccv7/GHSA-7jfh-2xc9-ccv7.json',
        },
      },
      {
        package: { name: 'public', ecosystem: 'npm', purl: 'pkg:npm/public' },
        versions: ['0.1.5'],
        database_specific: {
          source:
            'https://github.com/github/advisory-database/blob/main/advisories/github-reviewed/2019/05/GHSA-7jfh-2xc9-ccv7/GHSA-7jfh-2xc9-ccv7.json',
        },
      },
    ],
    schema_version: '1.3.0',
    _id: 'OBOFX1JDZQVO4hVE',
  };

  beforeAll(async () => {
    await fs.ensureDir(OsvOfflineDb.rootDirectory);

    const dbFile = path.join(OsvOfflineDb.rootDirectory, 'npm.nedb');
    await fs.writeFile(dbFile, JSON.stringify(sampleVuln), 'utf8');

    osvOfflineDb = await OsvOfflineDb.create();
  });

  describe('create', () => {
    it('create', async () => {
      await expect(OsvOfflineDb.create()).resolves.not.toThrow();
    });
  });

  describe('query', () => {
    it('works', async () => {
      const result = await osvOfflineDb.query('npm', 'public');
      expect(result).toStrictEqual([sampleVuln]);
    });

    it('returns empty array for invalid package', async () => {
      const result = await osvOfflineDb.query(
        'npm',
        'this-package-doesnt-exist'
      );

      expect(result).toBeEmptyArray();
    });
  });
});
