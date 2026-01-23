import { OsvOfflineDb } from './db';
import fs from 'fs-extra';
import path from 'path';
import type { Vulnerability } from './osv';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('packages/osv-offline-db/src/lib/db.int', () => {
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

  const ecosystemReservedCharactersVuln: Vulnerability & { _id: string } = {
    id: 'GHSA-v6x3-9r38-r27q',
    summary:
      'Sequoia PGP has Subtraction Overflow when aes_key_unwrap function is provided ciphertext that is too short',
    details:
      'In Sequoia before 2.1.0, aes_key_unwrap panics if passed a ciphertext that is too short. A remote attacker can take advantage of this issue to crash an application by sending a victim an encrypted message with a crafted PKESK or SKESK packet.',
    aliases: ['CVE-2025-67897', 'RUSTSEC-2025-0136'],
    modified: '2025-12-16T20:41:14.913900Z',
    published: '2025-12-14T06:30:24Z',
    references: [
      {
        type: 'ADVISORY',
        url: 'https://nvd.nist.gov/vuln/detail/CVE-2025-67897',
      },
    ],
    affected: [
      {
        package: {
          name: 'sequoia-openpgp',
          ecosystem: 'crates.io',
          purl: 'pkg:cargo/sequoia-openpgp',
        },
        ranges: [
          { type: 'SEMVER', events: [{ introduced: '0' }, { fixed: '2.1.0' }] },
        ],
        database_specific: {
          source:
            'https://github.com/github/advisory-database/blob/main/advisories/github-reviewed/2025/12/GHSA-v6x3-9r38-r27q/GHSA-v6x3-9r38-r27q.json',
        },
      },
    ],
    schema_version: '1.7.3',
    severity: [
      {
        type: 'CVSS_V3',
        score: 'CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:N/I:N/A:H',
      },
    ],
    _id: 'Q4nZsA8mLk7XbC2D',
  };

  const subecosystemVuln: Vulnerability & { _id: string } = {
    id: 'DRUPAL-CONTRIB-2025-035',
    details:
      "Stage File Proxy is a general solution for getting production files on a development server on demand.\n\nThe module doesn't sufficiently validate the existence of remote files prior to attempting to download and create them. An attacker could send many requests and exhaust disk resources.\n\nThis vulnerability is mitigated by the fact it only affects sites where the Origin is configured with a trailing slash. Sites that cannot upgrade immediately can confirm they do not have a trailing slash or remove the trailing slash to mitigate the issue.",
    aliases: ['CVE-2025-3734'],
    modified: '2025-12-10T23:41:32.476342Z',
    published: '2025-04-16T16:25:12Z',
    affected: [
      {
        package: {
          name: 'drupal/stage_file_proxy',
          ecosystem: 'Packagist:https://packages.drupal.org/8',
          purl: 'pkg:composer/drupal/stage_file_proxy',
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [{ introduced: '0' }, { fixed: '3.1.5' }],
            database_specific: { constraint: '<3.1.5' },
          },
        ],
        database_specific: {
          affected_versions: '<3.1.5',
          source:
            'https://github.com/DrupalSecurityTeam/drupal-advisory-database/blob/main/advisories/stage_file_proxy/DRUPAL-CONTRIB-2025-035.json',
        },
      },
    ],
    references: [
      { type: 'WEB', url: 'https://www.drupal.org/sa-contrib-2025-035' },
    ],
    schema_version: '1.7.3',
    _id: 'H78gsabNdM5adGZc',
  };

  beforeAll(async () => {
    await fs.ensureDir(OsvOfflineDb.rootDirectory);

    const npmDbFile = path.join(OsvOfflineDb.rootDirectory, 'npm.nedb');
    await fs.writeFile(npmDbFile, JSON.stringify(sampleVuln), 'utf8');

    const cratesDbFile = path.join(
      OsvOfflineDb.rootDirectory,
      'crates.io.nedb'
    );
    await fs.writeFile(
      cratesDbFile,
      JSON.stringify(ecosystemReservedCharactersVuln),
      'utf8'
    );

    const packagistDbFile = path.join(
      OsvOfflineDb.rootDirectory,
      'packagist.nedb'
    );
    await fs.writeFile(
      packagistDbFile,
      JSON.stringify(subecosystemVuln),
      'utf8'
    );

    osvOfflineDb = await OsvOfflineDb.create();
  });

  afterAll(async () => {
    await fs.rm(OsvOfflineDb.rootDirectory, { recursive: true, force: true });
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

    it('supports ecosystems with reserved regex characters', async () => {
      const result = await osvOfflineDb.query('crates.io', 'sequoia-openpgp');
      expect(result).toStrictEqual([ecosystemReservedCharactersVuln]);
    });

    it('supports subecosystems', async () => {
      const result = await osvOfflineDb.query(
        'Packagist',
        'drupal/stage_file_proxy'
      );
      expect(result).toStrictEqual([subecosystemVuln]);
    });

    it('returns empty array for invalid package', async () => {
      const result = await osvOfflineDb.query(
        'npm',
        'this-package-doesnt-exist'
      );

      expect(result).toEqual([]);
    });
  });
});
