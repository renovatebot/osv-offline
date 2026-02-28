import { OsvOfflineDb } from './db';
import fs from 'fs-extra';
import path from 'path';
import type { Vulnerability } from './osv';
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

describe('packages/osv-offline-db/src/lib/db.int', () => {
  const rootDir = OsvOfflineDb.rootDirectory;
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

  afterAll(async () => {
    await fs.rm(rootDir, { recursive: true, force: true });
  });

  async function createDbWithContent(fileName: string, content: string) {
    await fs.ensureDir(rootDir);
    await fs.writeFile(path.join(rootDir, fileName), content, 'utf8');
    return OsvOfflineDb.create();
  }

  describe('create', () => {
    it('create', () => {
      expect(() => OsvOfflineDb.create()[Symbol.dispose]()).not.toThrow();
    });

    it('silently skips missing ecosystem files', async () => {
      await fs.ensureDir(rootDir);
      await fs.emptyDir(rootDir);

      using db = OsvOfflineDb.create();

      const result = await db.query('npm', 'public');
      expect(result).toEqual([]);
    });

    it('ignores records with missing affected field', async () => {
      using osvOfflineDb = await createDbWithContent(
        'npm.nedb',
        JSON.stringify({
          ...sampleVuln,
          affected: undefined,
        })
      );

      const result = await osvOfflineDb.query('npm', 'public');
      expect(result).toHaveLength(0);
    });

    it('skips malformed JSON lines without crashing', async () => {
      const lines = [
        JSON.stringify(sampleVuln),
        'THIS IS NOT A VALID JSON LINE',
        JSON.stringify({ ...sampleVuln, id: 'GHSA-VALID-2' }),
      ].join('\n');

      using osvOfflineDb = await createDbWithContent('npm.nedb', lines);
      const result1 = await osvOfflineDb.query('npm', 'public');

      expect(result1).toHaveLength(2);
      expect(result1[0].id).toBe('GHSA-7jfh-2xc9-ccv7');
      expect(result1[1].id).toBe('GHSA-VALID-2');
    });

    it('groups multiple offset pointers per package', async () => {
      const vuln1 = { ...sampleVuln, id: 'VULN-1' };
      const vuln2 = { ...sampleVuln, id: 'VULN-2' };

      const content = [JSON.stringify(vuln1), JSON.stringify(vuln2)].join('\n');
      using osvOfflineDb = await createDbWithContent('npm.nedb', content);

      const result = await osvOfflineDb.query('npm', 'public');
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'VULN-1' }),
          expect.objectContaining({ id: 'VULN-2' }),
        ])
      );
    });

    it('deduplicates multiple entries for the same package in one record', async () => {
      const multiRangeVuln = {
        ...sampleVuln,
        affected: [
          {
            package: {
              name: 'public',
              ecosystem: 'npm',
              purl: 'pkg:npm/public',
            },
            ranges: [{ type: 'SEMVER', events: [{ introduced: '1.0.0' }] }],
          },
          {
            package: {
              name: 'public',
              ecosystem: 'npm',
              purl: 'pkg:npm/public',
            },
            ranges: [{ type: 'SEMVER', events: [{ introduced: '2.0.0' }] }],
          },
        ],
      };

      using osvOfflineDb = await createDbWithContent(
        'npm.nedb',
        JSON.stringify(multiRangeVuln)
      );

      const result = await osvOfflineDb.query('npm', 'public');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(sampleVuln.id);
    });

    it('registers exit handler that invokes Symbol.dispose', () => {
      const processOnSpy = vi.spyOn(process, 'on');

      using db = OsvOfflineDb.create();
      const closeHandlesSpy = vi.spyOn(db, Symbol.dispose);
      const exitCallback = processOnSpy.mock.calls.find(
        ([event]) => event === 'exit'
      )?.[1] as () => void;

      exitCallback();
      expect(closeHandlesSpy).toHaveBeenCalled();
    });
  });

  describe('query', () => {
    let osvOfflineDb: OsvOfflineDb;

    beforeEach(async () => {
      osvOfflineDb = await createDbWithContent(
        'npm.nedb',
        JSON.stringify(sampleVuln)
      );
    });

    afterEach(() => {
      osvOfflineDb?.[Symbol.dispose]();
    });

    it('works', async () => {
      const result = await osvOfflineDb.query('npm', 'public');
      expect(result).toStrictEqual([sampleVuln]);
    });

    it('returns empty array for invalid package', async () => {
      const result = await osvOfflineDb.query(
        'npm',
        'this-package-doesnt-exist'
      );

      expect(result).toEqual([]);
    });

    it('returns empty array for ecosystem that was not loaded', async () => {
      expect(await osvOfflineDb.query('Maven', 'public')).toEqual([]);
    });
  });

  describe('hot reload', () => {
    async function queryUntil(
      db: OsvOfflineDb,
      ecosystem: Parameters<OsvOfflineDb['query']>[0],
      packageName: string,
      predicate: (results: Vulnerability[]) => boolean,
      timeoutMs = 3000,
      intervalMs = 50
    ): Promise<Vulnerability[]> {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        const results = await db.query(ecosystem, packageName);
        if (predicate(results)) return results;
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }

      return db.query(ecosystem, packageName);
    }

    it('picks up new file content on next query when file changes', async () => {
      const filePath = path.join(rootDir, 'npm.nedb');

      using db = await createDbWithContent(
        'npm.nedb',
        JSON.stringify(sampleVuln)
      );

      // First query returns original data
      const result1 = await db.query('npm', 'public');
      expect(result1).toHaveLength(1);
      expect(result1[0].id).toBe('GHSA-7jfh-2xc9-ccv7');

      // Overwrite file with a different vulnerability
      const updatedVuln = { ...sampleVuln, id: 'GHSA-UPDATED' };
      await fs.writeFile(filePath, JSON.stringify(updatedVuln), 'utf8');

      // Force mtime to differ (file system mtime resolution can be 1s)
      const future = new Date(Date.now() + 5000);
      await fs.utimes(filePath, future, future);

      // Next query should eventually return the updated data
      const result2 = await queryUntil(
        db,
        'npm',
        'public',
        (r) => r.length === 1 && r[0].id === 'GHSA-UPDATED'
      );
      expect(result2).toHaveLength(1);
      expect(result2[0].id).toBe('GHSA-UPDATED');
    });

    it('returns empty when file is deleted after initial load', async () => {
      const filePath = path.join(rootDir, 'npm.nedb');

      using db = await createDbWithContent(
        'npm.nedb',
        JSON.stringify(sampleVuln)
      );

      // First query loads data
      const result1 = await db.query('npm', 'public');
      expect(result1).toHaveLength(1);

      await fs.remove(filePath);

      // Next query should eventually return empty
      const result2 = await queryUntil(
        db,
        'npm',
        'public',
        (r) => r.length === 0
      );
      expect(result2).toEqual([]);
    });

    it('only reloads the changed ecosystem, not others', async () => {
      const npmPath = path.join(rootDir, 'npm.nedb');

      const mavenVuln: Vulnerability = {
        ...sampleVuln,
        id: 'MAVEN-VULN-1',
        affected: [
          {
            package: {
              name: 'public',
              ecosystem: 'Maven',
              purl: 'pkg:maven/public',
            },
            ranges: [
              {
                type: 'SEMVER',
                events: [{ introduced: '0' }],
              },
            ],
          },
        ],
      };

      await fs.ensureDir(rootDir);
      await fs.writeFile(npmPath, JSON.stringify(sampleVuln), 'utf8');
      await fs.writeFile(
        path.join(rootDir, 'maven.nedb'),
        JSON.stringify(mavenVuln),
        'utf8'
      );

      using db = OsvOfflineDb.create();

      const npmResult1 = await db.query('npm', 'public');
      const mavenResult1 = await db.query('Maven', 'public');
      expect(npmResult1).toHaveLength(1);
      expect(mavenResult1).toHaveLength(1);

      const updatedVuln = { ...sampleVuln, id: 'NPM-UPDATED' };
      await fs.writeFile(npmPath, JSON.stringify(updatedVuln), 'utf8');
      const future = new Date(Date.now() + 5000);
      await fs.utimes(npmPath, future, future);

      // npm should eventually reflect the update
      const npmResult2 = await queryUntil(
        db,
        'npm',
        'public',
        (r) => r.length === 1 && r[0].id === 'NPM-UPDATED'
      );
      expect(npmResult2).toHaveLength(1);
      expect(npmResult2[0].id).toBe('NPM-UPDATED');

      // Maven should still return original data
      const mavenResult2 = await db.query('Maven', 'public');
      expect(mavenResult2).toHaveLength(1);
      expect(mavenResult2[0].id).toBe('MAVEN-VULN-1');
    });
  });
});
