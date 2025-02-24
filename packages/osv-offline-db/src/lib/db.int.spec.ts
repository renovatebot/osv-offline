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

  const sampleRpmVuln: Vulnerability & { _id: string } = {
    _id: 'asdfsdfa',
    id: 'CVE-2024-46713',
    database_specific: {
      severity: 'Important',
      cwe_ids: [
        'CWE-662'
      ]
    },
    modified: '2025-01-31T14:42:21Z',
    published: '2024-09-13T00:00:00Z',
    summary: 'kernel: perf/aux: Fix AUX buffer serialization',
    details: 'In the Linux kernel, the following vulnerability has been resolved:\n\nperf/aux: Fix AUX buffer serialization\n\nOle reported that event->mmap_mutex is strictly insufficient to\nserialize the AUX buffer, add a per RB mutex to fully serialize it.\n\nNote that in the lock order comment the perf_event::mmap_mutex order\nwas already wrong, that is, it nesting under mmap_lock is not new with\nthis patch.',
    affected: [
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/bpftool',
          purl: 'pkg:rpm/redhat/bpftool@7.4.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '7.4.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel',
          purl: 'pkg:rpm/redhat/kernel@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-64k',
          purl: 'pkg:rpm/redhat/kernel-64k@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-64k-core',
          purl: 'pkg:rpm/redhat/kernel-64k-core@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-64k-debug',
          purl: 'pkg:rpm/redhat/kernel-64k-debug@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-64k-debug-core',
          purl: 'pkg:rpm/redhat/kernel-64k-debug-core@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-64k-debug-modules',
          purl: 'pkg:rpm/redhat/kernel-64k-debug-modules@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-64k-debug-modules-core',
          purl: 'pkg:rpm/redhat/kernel-64k-debug-modules-core@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-64k-debug-modules-extra',
          purl: 'pkg:rpm/redhat/kernel-64k-debug-modules-extra@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-64k-modules',
          purl: 'pkg:rpm/redhat/kernel-64k-modules@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-64k-modules-core',
          purl: 'pkg:rpm/redhat/kernel-64k-modules-core@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-64k-modules-extra',
          purl: 'pkg:rpm/redhat/kernel-64k-modules-extra@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-core',
          purl: 'pkg:rpm/redhat/kernel-core@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-debug',
          purl: 'pkg:rpm/redhat/kernel-debug@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-debug-core',
          purl: 'pkg:rpm/redhat/kernel-debug-core@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-debug-modules',
          purl: 'pkg:rpm/redhat/kernel-debug-modules@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-debug-modules-core',
          purl: 'pkg:rpm/redhat/kernel-debug-modules-core@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-debug-modules-extra',
          purl: 'pkg:rpm/redhat/kernel-debug-modules-extra@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-modules',
          purl: 'pkg:rpm/redhat/kernel-modules@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-modules-core',
          purl: 'pkg:rpm/redhat/kernel-modules-core@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-modules-extra',
          purl: 'pkg:rpm/redhat/kernel-modules-extra@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-tools',
          purl: 'pkg:rpm/redhat/kernel-tools@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-tools-libs',
          purl: 'pkg:rpm/redhat/kernel-tools-libs@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/python3-perf',
          purl: 'pkg:rpm/redhat/python3-perf@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/bpftool-debuginfo',
          purl: 'pkg:rpm/redhat/bpftool-debuginfo@7.4.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '7.4.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-64k-debug-debuginfo',
          purl: 'pkg:rpm/redhat/kernel-64k-debug-debuginfo@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-64k-debuginfo',
          purl: 'pkg:rpm/redhat/kernel-64k-debuginfo@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-debug-debuginfo',
          purl: 'pkg:rpm/redhat/kernel-debug-debuginfo@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-debuginfo',
          purl: 'pkg:rpm/redhat/kernel-debuginfo@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-debuginfo-common-aarch64',
          purl: 'pkg:rpm/redhat/kernel-debuginfo-common-aarch64@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-rt-debug-debuginfo',
          purl: 'pkg:rpm/redhat/kernel-rt-debug-debuginfo@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-rt-debuginfo',
          purl: 'pkg:rpm/redhat/kernel-rt-debuginfo@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-tools-debuginfo',
          purl: 'pkg:rpm/redhat/kernel-tools-debuginfo@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/libperf-debuginfo',
          purl: 'pkg:rpm/redhat/libperf-debuginfo@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/perf-debuginfo',
          purl: 'pkg:rpm/redhat/perf-debuginfo@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/python3-perf-debuginfo',
          purl: 'pkg:rpm/redhat/python3-perf-debuginfo@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-64k-debug-devel',
          purl: 'pkg:rpm/redhat/kernel-64k-debug-devel@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-64k-debug-devel-matched',
          purl: 'pkg:rpm/redhat/kernel-64k-debug-devel-matched@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-64k-devel',
          purl: 'pkg:rpm/redhat/kernel-64k-devel@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-64k-devel-matched',
          purl: 'pkg:rpm/redhat/kernel-64k-devel-matched@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-debug-devel',
          purl: 'pkg:rpm/redhat/kernel-debug-devel@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-debug-devel-matched',
          purl: 'pkg:rpm/redhat/kernel-debug-devel-matched@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-devel',
          purl: 'pkg:rpm/redhat/kernel-devel@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-devel-matched',
          purl: 'pkg:rpm/redhat/kernel-devel-matched@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-headers',
          purl: 'pkg:rpm/redhat/kernel-headers@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/perf',
          purl: 'pkg:rpm/redhat/perf@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/rtla',
          purl: 'pkg:rpm/redhat/rtla@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/rv',
          purl: 'pkg:rpm/redhat/rv@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-cross-headers',
          purl: 'pkg:rpm/redhat/kernel-cross-headers@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-tools-libs-devel',
          purl: 'pkg:rpm/redhat/kernel-tools-libs-devel@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/libperf',
          purl: 'pkg:rpm/redhat/libperf@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-debuginfo-common-ppc64le',
          purl: 'pkg:rpm/redhat/kernel-debuginfo-common-ppc64le@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-debug-uki-virt',
          purl: 'pkg:rpm/redhat/kernel-debug-uki-virt@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-uki-virt',
          purl: 'pkg:rpm/redhat/kernel-uki-virt@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-uki-virt-addons',
          purl: 'pkg:rpm/redhat/kernel-uki-virt-addons@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-debuginfo-common-x86_64',
          purl: 'pkg:rpm/redhat/kernel-debuginfo-common-x86_64@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-rt',
          purl: 'pkg:rpm/redhat/kernel-rt@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-rt-core',
          purl: 'pkg:rpm/redhat/kernel-rt-core@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-rt-debug',
          purl: 'pkg:rpm/redhat/kernel-rt-debug@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-rt-debug-core',
          purl: 'pkg:rpm/redhat/kernel-rt-debug-core@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-rt-debug-devel',
          purl: 'pkg:rpm/redhat/kernel-rt-debug-devel@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-rt-debug-modules',
          purl: 'pkg:rpm/redhat/kernel-rt-debug-modules@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-rt-debug-modules-core',
          purl: 'pkg:rpm/redhat/kernel-rt-debug-modules-core@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-rt-debug-modules-extra',
          purl: 'pkg:rpm/redhat/kernel-rt-debug-modules-extra@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-rt-devel',
          purl: 'pkg:rpm/redhat/kernel-rt-devel@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-rt-modules',
          purl: 'pkg:rpm/redhat/kernel-rt-modules@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-rt-modules-core',
          purl: 'pkg:rpm/redhat/kernel-rt-modules-core@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-rt-modules-extra',
          purl: 'pkg:rpm/redhat/kernel-rt-modules-extra@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-rt-debug-kvm',
          purl: 'pkg:rpm/redhat/kernel-rt-debug-kvm@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-rt-kvm',
          purl: 'pkg:rpm/redhat/kernel-rt-kvm@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-zfcpdump',
          purl: 'pkg:rpm/redhat/kernel-zfcpdump@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-zfcpdump-core',
          purl: 'pkg:rpm/redhat/kernel-zfcpdump-core@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-zfcpdump-modules',
          purl: 'pkg:rpm/redhat/kernel-zfcpdump-modules@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-zfcpdump-modules-core',
          purl: 'pkg:rpm/redhat/kernel-zfcpdump-modules-core@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-zfcpdump-modules-extra',
          purl: 'pkg:rpm/redhat/kernel-zfcpdump-modules-extra@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-debuginfo-common-s390x',
          purl: 'pkg:rpm/redhat/kernel-debuginfo-common-s390x@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-zfcpdump-debuginfo',
          purl: 'pkg:rpm/redhat/kernel-zfcpdump-debuginfo@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-zfcpdump-devel',
          purl: 'pkg:rpm/redhat/kernel-zfcpdump-devel@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-zfcpdump-devel-matched',
          purl: 'pkg:rpm/redhat/kernel-zfcpdump-devel-matched@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-abi-stablelists',
          purl: 'pkg:rpm/redhat/kernel-abi-stablelists@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      },
      {
        package: {
          ecosystem: 'Red Hat',
          name: 'redhat/kernel-doc',
          purl: 'pkg:rpm/redhat/kernel-doc@5.14.0-503.21.1.el9_5'
        },
        ranges: [
          {
            type: 'ECOSYSTEM',
            events: [
              {
                introduced: '0.0.0'
              },
              {
                fixed: '5.14.0-503.21.1.el9_5'
              }
            ]
          }
        ]
      }
    ],
    references: [
      {
        type: 'REPORT',
        url: 'https://access.redhat.com/security/cve/CVE-2024-46713'
      },
      {
        type: 'WEB',
        url: 'https://bugzilla.redhat.com/show_bug.cgi?id=2312221'
      },
      {
        type: 'WEB',
        url: 'https://www.cve.org/CVERecord?id=CVE-2024-46713'
      },
      {
        type: 'WEB',
        url: 'https://nvd.nist.gov/vuln/detail/CVE-2024-46713'
      },
      {
        type: 'WEB',
        url: 'https://lore.kernel.org/linux-cve-announce/2024091316-CVE-2024-46713-5e49@gregkh/T'
      }
    ]
  };

  const containerVuln: Vulnerability & { _id: string } = {
    _id: 'abcdef',
    schema_version: '1.2.3',
    id: 'GHSA-22cc-w7xm-rfhx',
    modified: '2024-06-21T19:36:07.296811Z',
    published: '2024-06-20T19:53:30Z',
    aliases: ['CVE-2019-7617', 'PYSEC-2019-178'],
    related: [
      'CGA-2ph7-wp75-g3rf',
      'CGA-326j-45xp-qqrg',
      'CGA-3727-xg6m-m6g6'
    ],
    summary: 'redis-py Race Condition vulnerability',
    details:
      'redis-py before 4.5.3, as used in ChatGPT and other products, leaves a connection open after canceling',
    severity: [
      {
        type: 'CVSS_V3',
        score: 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H'
      }
    ],
    affected: [
      {
        package: {
          ecosystem: 'Docker',
          name: 'quay.io/prometheus/node-exporter',
          purl: 'pkg:oci/assisted-installer-agent-rhel8@sha256:ca8d86079cd97908146284f1da90964c78cae7b9e45b7f44fb4c3c5e44c0cfb2?arch=arm64&repository_url=registry.redhat.io/multicluster-engine/assisted-installer-agent-rhel8&tag=v2.4.4-8'
        }
      },
      {
        package: {
          ecosystem: 'Docker',
          name: 'quay.io/prometheus/nodaae-exporter',
          purl: 'pkg:oci/assisted-installer-agent-rhel8@sha256:ca8d86079cd97908146284f1da90964c78cae7b9e45b7f44fb4c3c5e44c0cfb2?arch=arm64&repository_url=registry.redhat.io/multicluster-engine/assisted-installer-agent-rhel8&tag=v2.4.4-8'
        }
      }
    ]
  }

  beforeAll(async () => {
    await fs.ensureDir(OsvOfflineDb.rootDirectory);

    const dbFile = path.join(OsvOfflineDb.rootDirectory, 'npm.nedb');
    await fs.writeFile(dbFile, JSON.stringify(sampleVuln), 'utf8');

    const rpmDbFile = path.join(OsvOfflineDb.rootDirectory, 'rpm.nedb');
    await fs.writeFile(rpmDbFile, JSON.stringify(sampleRpmVuln), 'utf8');

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

    it('works for RPMs', async () => {
      const result = await osvOfflineDb.query('RPM', 'redhat/kernel-headers');
      expect(result).toStrictEqual([sampleRpmVuln]);
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
