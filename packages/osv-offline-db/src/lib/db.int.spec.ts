import { OsvOfflineDb } from './db';
import fs from 'fs-extra';
import path from 'path';
import type { Vulnerability } from './osv';

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

  const containerVuln: Vulnerability & { _id: string } = {
    _id: "abcdef",
    schema_version: "1.2.3",
    id: "GHSA-22cc-w7xm-rfhx",
    modified: "2024-06-21T19:36:07.296811Z",
    published: "2024-06-20T19:53:30Z",
    aliases: ["CVE-2019-7617", "PYSEC-2019-178"],
    related: [
      "CGA-2ph7-wp75-g3rf",
      "CGA-326j-45xp-qqrg",
      "CGA-3727-xg6m-m6g6"
    ],
    summary: "redis-py Race Condition vulnerability",
    details:
      "redis-py before 4.5.3, as used in ChatGPT and other products, leaves a connection open after canceling",
    severity: [
      {
        type: "CVSS_V3",
        score: "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H"
      }
    ],
    affected: [
      {
        package: {
          ecosystem: "Docker",
          name: "quay.io/prometheus/node-exporter",
          purl: "pkg:oci/assisted-installer-agent-rhel8@sha256:ca8d86079cd97908146284f1da90964c78cae7b9e45b7f44fb4c3c5e44c0cfb2?arch=arm64&repository_url=registry.redhat.io/multicluster-engine/assisted-installer-agent-rhel8&tag=v2.4.4-8"
        }
      },
      {
        package: {
          ecosystem: "Docker",
          name: "quay.io/prometheus/nodaae-exporter",
          purl: "pkg:oci/assisted-installer-agent-rhel8@sha256:ca8d86079cd97908146284f1da90964c78cae7b9e45b7f44fb4c3c5e44c0cfb2?arch=arm64&repository_url=registry.redhat.io/multicluster-engine/assisted-installer-agent-rhel8&tag=v2.4.4-8"
        }
      }
    ]
  }

  beforeAll(async () => {
    await fs.ensureDir(OsvOfflineDb.rootDirectory);

    const dbFile = path.join(OsvOfflineDb.rootDirectory, 'npm.nedb');
    await fs.writeFile(dbFile, JSON.stringify(sampleVuln), 'utf8');

    const containerDbFile = path.join(OsvOfflineDb.rootDirectory, 'docker.nedb');
    await fs.writeFile(containerDbFile, JSON.stringify(containerVuln), 'utf8');

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

  describe('query_containers', () => {
    it('works', async () => {
      const result = await osvOfflineDb.query_containers('quay.io/prometheus/node-exporter');
      expect(result).toStrictEqual([containerVuln]);
    });

    it('returns empty array for invalid package', async () => {
      const result = await osvOfflineDb.query_containers('this-package-doesnt-exist');

      expect(result).toBeEmptyArray();
    });
  });
});
