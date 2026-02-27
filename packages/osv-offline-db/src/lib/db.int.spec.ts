import { OsvOfflineDb } from './db';
import fs from 'fs-extra';
import path from 'path';
import type { Vulnerability } from './osv';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

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
      expect(() => OsvOfflineDb.create()).not.toThrow();
    });

    it('silently skips missing ecosystem files', async () => {
      await fs.ensureDir(rootDir);
      await fs.emptyDir(rootDir);

      const db = OsvOfflineDb.create();

      const result = await db.query('npm', 'public');
      expect(result).toEqual([]);
    });

    it('ignores records with missing affected field', async () => {
      const osvOfflineDb = await createDbWithContent(
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

      const osvOfflineDb = await createDbWithContent('npm.nedb', lines);
      const result1 = await osvOfflineDb.query('npm', 'public');

      expect(result1).toHaveLength(2);
      expect(result1[0].id).toBe('GHSA-7jfh-2xc9-ccv7');
      expect(result1[1].id).toBe('GHSA-VALID-2');
    });

    it('groups multiple offset pointers per package', async () => {
      const vuln1 = { ...sampleVuln, id: 'VULN-1' };
      const vuln2 = { ...sampleVuln, id: 'VULN-2' };

      const content = [JSON.stringify(vuln1), JSON.stringify(vuln2)].join('\n');
      const osvOfflineDb = await createDbWithContent('npm.nedb', content);

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

      const osvOfflineDb = await createDbWithContent(
        'npm.nedb',
        JSON.stringify(multiRangeVuln)
      );

      const result = await osvOfflineDb.query('npm', 'public');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(sampleVuln.id);
    });

    it('registers exit handler that invokes Symbol.dispose', () => {
      const processOnSpy = vi.spyOn(process, 'on');

      const db = OsvOfflineDb.create();
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
});
