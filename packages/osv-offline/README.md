# osv-offline

[![Package version](https://img.shields.io/npm/v/@renovatebot/osv-offline?style=for-the-badge)](https://www.npmjs.com/package/@renovatebot/osv-offline)
[![Build status](https://img.shields.io/github/actions/workflow/status/renovatebot/osv-offline/build.yml?branch=main&style=for-the-badge)](https://github.com/renovatebot/osv-offline/actions/workflows/build.yml)
[![MIT license](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](./LICENSE)

## Environment variables

| Name                           | Description                                                                                                                             | Default                                                                               |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `OSV_OFFLINE_ROOT_DIR`         | Directory of the downloaded databases                                                                                                   | `<tmpdir>/osv-offline`                                                                |
| `OSV_OFFLINE_DATABASE_URL`     | URL of the database zip                                                                                                                 | `https://github.com/renovatebot/osv-offline/releases/latest/download/osv-offline.zip` |
| `OSV_OFFLINE_DISABLE_DOWNLOAD` | Set to `true` to use the databases in `OSV_OFFLINE_ROOT_DIR` without downloading them                                                   | -                                                                                     |
| `OSV_OFFLINE_MAX_AGE`          | How old the downloaded databases may be before they are downloaded again, as a [`ms`](https://github.com/vercel/ms) duration, e.g. `4h` | `1d`                                                                                  |

## License

This package is licensed under [the MIT license](https://opensource.org/licenses/MIT).

Vulnerabilities are provided from the following upstream data sources and licenses:

- [GitHub Advisory Database](https://github.com/github/advisory-database) ([CC-BY 4.0](https://github.com/github/advisory-database/blob/main/LICENSE.md))
- [PyPI Advisory Database](https://github.com/pypa/advisory-database) ([CC-BY 4.0](https://github.com/pypa/advisory-database/blob/main/LICENSE))
- [Go Vulnerability Database](https://github.com/golang/vulndb) ([CC-BY 4.0](https://github.com/golang/vulndb#license))
- [Rust Advisory Database](https://github.com/RustSec/advisory-db) ([CC0 1.0](https://github.com/rustsec/advisory-db/blob/main/LICENSE.txt))
- [Global Security Database](https://github.com/cloudsecurityalliance/gsd-database) ([CC0 1.0](https://github.com/cloudsecurityalliance/gsd-database/blob/main/LICENSE))
- [OSS-Fuzz](https://github.com/google/oss-fuzz-vulns) ([CC-BY 4.0](https://github.com/google/oss-fuzz-vulns/blob/main/LICENSE))
