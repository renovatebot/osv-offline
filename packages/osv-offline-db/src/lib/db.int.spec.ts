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
    modified: '2025-02-24T15:47:41Z',
    published: '2024-09-13T00:00:00Z',
    summary: 'kernel: perf/aux: Fix AUX buffer serialization',
    details: 'In the Linux kernel, the following vulnerability has been resolved:\n\nperf/aux: Fix AUX buffer serialization\n\nOle reported that event->mmap_mutex is strictly insufficient to\nserialize the AUX buffer, add a per RB mutex to fully serialize it.\n\nNote that in the lock order comment the perf_event::mmap_mutex order\nwas already wrong, that is, it nesting under mmap_lock is not new with\nthis patch.',
    affected: [
      {
        package: {
          ecosystem: 'RPM',
          name: 'bpftool',
          purl: 'pkg:rpm/redhat/bpftool'
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
          ecosystem: 'RPM',
          name: 'kernel',
          purl: 'pkg:rpm/redhat/kernel'
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
          ecosystem: 'RPM',
          name: 'kernel-64k',
          purl: 'pkg:rpm/redhat/kernel-64k'
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
          ecosystem: 'RPM',
          name: 'kernel-64k-core',
          purl: 'pkg:rpm/redhat/kernel-64k-core'
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
          ecosystem: 'RPM',
          name: 'kernel-64k-debug',
          purl: 'pkg:rpm/redhat/kernel-64k-debug'
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
          ecosystem: 'RPM',
          name: 'kernel-64k-debug-core',
          purl: 'pkg:rpm/redhat/kernel-64k-debug-core'
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
          ecosystem: 'RPM',
          name: 'kernel-64k-debug-modules',
          purl: 'pkg:rpm/redhat/kernel-64k-debug-modules'
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
          ecosystem: 'RPM',
          name: 'kernel-64k-debug-modules-core',
          purl: 'pkg:rpm/redhat/kernel-64k-debug-modules-core'
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
          ecosystem: 'RPM',
          name: 'kernel-64k-debug-modules-extra',
          purl: 'pkg:rpm/redhat/kernel-64k-debug-modules-extra'
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
          ecosystem: 'RPM',
          name: 'kernel-64k-modules',
          purl: 'pkg:rpm/redhat/kernel-64k-modules'
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
          ecosystem: 'RPM',
          name: 'kernel-64k-modules-core',
          purl: 'pkg:rpm/redhat/kernel-64k-modules-core'
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
          ecosystem: 'RPM',
          name: 'kernel-64k-modules-extra',
          purl: 'pkg:rpm/redhat/kernel-64k-modules-extra'
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
          ecosystem: 'RPM',
          name: 'kernel-core',
          purl: 'pkg:rpm/redhat/kernel-core'
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
          ecosystem: 'RPM',
          name: 'kernel-debug',
          purl: 'pkg:rpm/redhat/kernel-debug'
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
          ecosystem: 'RPM',
          name: 'kernel-debug-core',
          purl: 'pkg:rpm/redhat/kernel-debug-core'
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
          ecosystem: 'RPM',
          name: 'kernel-debug-modules',
          purl: 'pkg:rpm/redhat/kernel-debug-modules'
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
          ecosystem: 'RPM',
          name: 'kernel-debug-modules-core',
          purl: 'pkg:rpm/redhat/kernel-debug-modules-core'
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
          ecosystem: 'RPM',
          name: 'kernel-debug-modules-extra',
          purl: 'pkg:rpm/redhat/kernel-debug-modules-extra'
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
          ecosystem: 'RPM',
          name: 'kernel-modules',
          purl: 'pkg:rpm/redhat/kernel-modules'
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
          ecosystem: 'RPM',
          name: 'kernel-modules-core',
          purl: 'pkg:rpm/redhat/kernel-modules-core'
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
          ecosystem: 'RPM',
          name: 'kernel-modules-extra',
          purl: 'pkg:rpm/redhat/kernel-modules-extra'
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
          ecosystem: 'RPM',
          name: 'kernel-tools',
          purl: 'pkg:rpm/redhat/kernel-tools'
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
          ecosystem: 'RPM',
          name: 'kernel-tools-libs',
          purl: 'pkg:rpm/redhat/kernel-tools-libs'
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
          ecosystem: 'RPM',
          name: 'python3-perf',
          purl: 'pkg:rpm/redhat/python3-perf'
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
          ecosystem: 'RPM',
          name: 'bpftool-debuginfo',
          purl: 'pkg:rpm/redhat/bpftool-debuginfo'
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
          ecosystem: 'RPM',
          name: 'kernel-64k-debug-debuginfo',
          purl: 'pkg:rpm/redhat/kernel-64k-debug-debuginfo'
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
          ecosystem: 'RPM',
          name: 'kernel-64k-debuginfo',
          purl: 'pkg:rpm/redhat/kernel-64k-debuginfo'
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
          ecosystem: 'RPM',
          name: 'kernel-debug-debuginfo',
          purl: 'pkg:rpm/redhat/kernel-debug-debuginfo'
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
          ecosystem: 'RPM',
          name: 'kernel-debuginfo',
          purl: 'pkg:rpm/redhat/kernel-debuginfo'
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
          ecosystem: 'RPM',
          name: 'kernel-debuginfo-common-aarch64',
          purl: 'pkg:rpm/redhat/kernel-debuginfo-common-aarch64'
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
          ecosystem: 'RPM',
          name: 'kernel-rt-debug-debuginfo',
          purl: 'pkg:rpm/redhat/kernel-rt-debug-debuginfo'
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
          ecosystem: 'RPM',
          name: 'kernel-rt-debuginfo',
          purl: 'pkg:rpm/redhat/kernel-rt-debuginfo'
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
          ecosystem: 'RPM',
          name: 'kernel-tools-debuginfo',
          purl: 'pkg:rpm/redhat/kernel-tools-debuginfo'
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
          ecosystem: 'RPM',
          name: 'libperf-debuginfo',
          purl: 'pkg:rpm/redhat/libperf-debuginfo'
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
          ecosystem: 'RPM',
          name: 'perf-debuginfo',
          purl: 'pkg:rpm/redhat/perf-debuginfo'
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
          ecosystem: 'RPM',
          name: 'python3-perf-debuginfo',
          purl: 'pkg:rpm/redhat/python3-perf-debuginfo'
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
          ecosystem: 'RPM',
          name: 'kernel-64k-debug-devel',
          purl: 'pkg:rpm/redhat/kernel-64k-debug-devel'
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
          ecosystem: 'RPM',
          name: 'kernel-64k-debug-devel-matched',
          purl: 'pkg:rpm/redhat/kernel-64k-debug-devel-matched'
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
          ecosystem: 'RPM',
          name: 'kernel-64k-devel',
          purl: 'pkg:rpm/redhat/kernel-64k-devel'
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
          ecosystem: 'RPM',
          name: 'kernel-64k-devel-matched',
          purl: 'pkg:rpm/redhat/kernel-64k-devel-matched'
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
          ecosystem: 'RPM',
          name: 'kernel-debug-devel',
          purl: 'pkg:rpm/redhat/kernel-debug-devel'
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
          ecosystem: 'RPM',
          name: 'kernel-debug-devel-matched',
          purl: 'pkg:rpm/redhat/kernel-debug-devel-matched'
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
          ecosystem: 'RPM',
          name: 'kernel-devel',
          purl: 'pkg:rpm/redhat/kernel-devel'
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
          ecosystem: 'RPM',
          name: 'kernel-devel-matched',
          purl: 'pkg:rpm/redhat/kernel-devel-matched'
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
          ecosystem: 'RPM',
          name: 'kernel-headers',
          purl: 'pkg:rpm/redhat/kernel-headers'
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
          ecosystem: 'RPM',
          name: 'perf',
          purl: 'pkg:rpm/redhat/perf'
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
          ecosystem: 'RPM',
          name: 'rtla',
          purl: 'pkg:rpm/redhat/rtla'
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
          ecosystem: 'RPM',
          name: 'rv',
          purl: 'pkg:rpm/redhat/rv'
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
          ecosystem: 'RPM',
          name: 'kernel-cross-headers',
          purl: 'pkg:rpm/redhat/kernel-cross-headers'
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
          ecosystem: 'RPM',
          name: 'kernel-tools-libs-devel',
          purl: 'pkg:rpm/redhat/kernel-tools-libs-devel'
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
          ecosystem: 'RPM',
          name: 'libperf',
          purl: 'pkg:rpm/redhat/libperf'
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
          ecosystem: 'RPM',
          name: 'kernel-debuginfo-common-ppc64le',
          purl: 'pkg:rpm/redhat/kernel-debuginfo-common-ppc64le'
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
          ecosystem: 'RPM',
          name: 'kernel-debug-uki-virt',
          purl: 'pkg:rpm/redhat/kernel-debug-uki-virt'
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
          ecosystem: 'RPM',
          name: 'kernel-uki-virt',
          purl: 'pkg:rpm/redhat/kernel-uki-virt'
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
          ecosystem: 'RPM',
          name: 'kernel-uki-virt-addons',
          purl: 'pkg:rpm/redhat/kernel-uki-virt-addons'
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
          ecosystem: 'RPM',
          name: 'kernel-debuginfo-common-x86_64',
          purl: 'pkg:rpm/redhat/kernel-debuginfo-common-x86_64'
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
          ecosystem: 'RPM',
          name: 'kernel-rt',
          purl: 'pkg:rpm/redhat/kernel-rt'
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
          ecosystem: 'RPM',
          name: 'kernel-rt-core',
          purl: 'pkg:rpm/redhat/kernel-rt-core'
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
          ecosystem: 'RPM',
          name: 'kernel-rt-debug',
          purl: 'pkg:rpm/redhat/kernel-rt-debug'
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
          ecosystem: 'RPM',
          name: 'kernel-rt-debug-core',
          purl: 'pkg:rpm/redhat/kernel-rt-debug-core'
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
          ecosystem: 'RPM',
          name: 'kernel-rt-debug-devel',
          purl: 'pkg:rpm/redhat/kernel-rt-debug-devel'
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
          ecosystem: 'RPM',
          name: 'kernel-rt-debug-modules',
          purl: 'pkg:rpm/redhat/kernel-rt-debug-modules'
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
          ecosystem: 'RPM',
          name: 'kernel-rt-debug-modules-core',
          purl: 'pkg:rpm/redhat/kernel-rt-debug-modules-core'
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
          ecosystem: 'RPM',
          name: 'kernel-rt-debug-modules-extra',
          purl: 'pkg:rpm/redhat/kernel-rt-debug-modules-extra'
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
          ecosystem: 'RPM',
          name: 'kernel-rt-devel',
          purl: 'pkg:rpm/redhat/kernel-rt-devel'
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
          ecosystem: 'RPM',
          name: 'kernel-rt-modules',
          purl: 'pkg:rpm/redhat/kernel-rt-modules'
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
          ecosystem: 'RPM',
          name: 'kernel-rt-modules-core',
          purl: 'pkg:rpm/redhat/kernel-rt-modules-core'
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
          ecosystem: 'RPM',
          name: 'kernel-rt-modules-extra',
          purl: 'pkg:rpm/redhat/kernel-rt-modules-extra'
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
          ecosystem: 'RPM',
          name: 'kernel-rt-debug-kvm',
          purl: 'pkg:rpm/redhat/kernel-rt-debug-kvm'
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
          ecosystem: 'RPM',
          name: 'kernel-rt-kvm',
          purl: 'pkg:rpm/redhat/kernel-rt-kvm'
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
          ecosystem: 'RPM',
          name: 'kernel-zfcpdump',
          purl: 'pkg:rpm/redhat/kernel-zfcpdump'
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
          ecosystem: 'RPM',
          name: 'kernel-zfcpdump-core',
          purl: 'pkg:rpm/redhat/kernel-zfcpdump-core'
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
          ecosystem: 'RPM',
          name: 'kernel-zfcpdump-modules',
          purl: 'pkg:rpm/redhat/kernel-zfcpdump-modules'
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
          ecosystem: 'RPM',
          name: 'kernel-zfcpdump-modules-core',
          purl: 'pkg:rpm/redhat/kernel-zfcpdump-modules-core'
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
          ecosystem: 'RPM',
          name: 'kernel-zfcpdump-modules-extra',
          purl: 'pkg:rpm/redhat/kernel-zfcpdump-modules-extra'
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
          ecosystem: 'RPM',
          name: 'kernel-debuginfo-common-s390x',
          purl: 'pkg:rpm/redhat/kernel-debuginfo-common-s390x'
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
          ecosystem: 'RPM',
          name: 'kernel-zfcpdump-debuginfo',
          purl: 'pkg:rpm/redhat/kernel-zfcpdump-debuginfo'
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
          ecosystem: 'RPM',
          name: 'kernel-zfcpdump-devel',
          purl: 'pkg:rpm/redhat/kernel-zfcpdump-devel'
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
          ecosystem: 'RPM',
          name: 'kernel-zfcpdump-devel-matched',
          purl: 'pkg:rpm/redhat/kernel-zfcpdump-devel-matched'
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
          ecosystem: 'RPM',
          name: 'kernel-abi-stablelists',
          purl: 'pkg:rpm/redhat/kernel-abi-stablelists'
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
          ecosystem: 'RPM',
          name: 'kernel-doc',
          purl: 'pkg:rpm/redhat/kernel-doc'
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
      const result = await osvOfflineDb.query('RPM', 'kernel-headers');
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
