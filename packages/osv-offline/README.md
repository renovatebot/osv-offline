# osv-offline

[![Package version](https://img.shields.io/npm/v/@renovatebot/osv-offline?style=for-the-badge)](https://www.npmjs.com/package/@renovatebot/osv-offline)
[![Build status](https://img.shields.io/github/actions/workflow/status/renovatebot/osv-offline/build.yml?branch=main&style=for-the-badge)](https://github.com/renovatebot/osv-offline/actions/workflows/build.yml)
[![MIT license](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](./LICENSE)

## Environment variables

| Name                             | Description                                                                                                                                               | Default                                                                               |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `OSV_OFFLINE_ROOT_DIR`           | Directory of the downloaded databases                                                                                                                     | `<tmpdir>/osv-offline`                                                                |
| `OSV_OFFLINE_DATABASE_FORMAT`    | `zip` downloads all databases as one zip; `split` downloads each ecosystem on its first query, and again only when it changed                             | `zip`                                                                                 |
| `OSV_OFFLINE_DATABASE_URL`       | URL of the database zip                                                                                                                                   | `https://github.com/renovatebot/osv-offline/releases/latest/download/osv-offline.zip` |
| `OSV_OFFLINE_DATABASE_INDEX_URL` | URL of the `index.json` of the split format                                                                                                               | `https://renovatebot.github.io/osv-offline/v2/index.json`                             |
| `OSV_OFFLINE_DISABLE_DOWNLOAD`   | Set to `true` to use the databases in `OSV_OFFLINE_ROOT_DIR` without downloading them                                                                     | -                                                                                     |
| `OSV_OFFLINE_MAX_AGE`            | How old the downloaded databases may be before they are downloaded again, as an [`ms`](https://github.com/vercel/ms) duration such as `30m`, `4h` or `7d` | `1d`                                                                                  |

### Split format

With `OSV_OFFLINE_DATABASE_FORMAT=split`, the databases are downloaded from the release of the latest database update (`https://github.com/renovatebot/osv-offline/releases/download/1-<yyyyMMddHHmmss>/`), as listed by the index on `https://renovatebot.github.io/osv-offline/`. When outgoing traffic is restricted, allow `github.com`, `release-assets.githubusercontent.com` (where the downloads redirect to) and `renovatebot.github.io`.

To mirror the split format, copy `index.json` without its `baseUrl` and the files it lists into one directory, and set `OSV_OFFLINE_DATABASE_INDEX_URL` to the mirrored `index.json`. Files are resolved relative to the index then.

### Without internet access

These variables also apply to [Renovate's `osvVulnerabilityAlerts`](https://docs.renovatebot.com/configuration-options/#osvvulnerabilityalerts), which uses this package.

`osv-offline` downloads the databases again once they're older than `OSV_OFFLINE_MAX_AGE`, one day by default. Set `OSV_OFFLINE_DISABLE_DOWNLOAD=true` to turn that off.

To use an internal mirror, copy `osv-offline.zip` from the [latest release](https://github.com/renovatebot/osv-offline/releases/latest) to an internal web server and set `OSV_OFFLINE_DATABASE_URL` to the copy. The databases are downloaded from there again after `OSV_OFFLINE_MAX_AGE`.

Without any downloads, extract the databases yourself and disable the download:

```sh
export OSV_OFFLINE_ROOT_DIR=/var/lib/osv-offline
export OSV_OFFLINE_DISABLE_DOWNLOAD=true
unzip -o osv-offline.zip -d "$OSV_OFFLINE_ROOT_DIR"
```

- `OSV_OFFLINE_ROOT_DIR` needs one `<ecosystem>.nedb` per ecosystem, e.g. `npm.nedb`; the `<ecosystem>.idx.json` next to it is optional but recommended, as it makes opening the database about four times faster
- to update while Renovate runs, extract a newer zip into a temporary directory on the same file system and move the files into `OSV_OFFLINE_ROOT_DIR`, the `.idx.json` files before the `.nedb` files, so no database is read while it's written

## Logging

The packages log to the logger set with `configure({ logger })` of [`@containerbase/base`](https://www.npmjs.com/package/@containerbase/base), eg. a pino or Renovate logger.
Their messages start with `OSV:`, eg. for Renovate's `logLevelRemap`.
Without one, they log through [`debug`](https://github.com/debug-js/debug) (namespace `osv-offline:*`).

## License

This package is licensed under [the MIT license](https://opensource.org/licenses/MIT).

Vulnerabilities are provided from the following upstream data sources and licenses:

- [GitHub Advisory Database](https://github.com/github/advisory-database) ([CC-BY 4.0](https://github.com/github/advisory-database/blob/main/LICENSE.md))
- [PyPI Advisory Database](https://github.com/pypa/advisory-database) ([CC-BY 4.0](https://github.com/pypa/advisory-database/blob/main/LICENSE))
- [Go Vulnerability Database](https://github.com/golang/vulndb) ([CC-BY 4.0](https://github.com/golang/vulndb#license))
- [Rust Advisory Database](https://github.com/RustSec/advisory-db) ([CC0 1.0](https://github.com/rustsec/advisory-db/blob/main/LICENSE.txt))
- [Global Security Database](https://github.com/cloudsecurityalliance/gsd-database) ([CC0 1.0](https://github.com/cloudsecurityalliance/gsd-database/blob/main/LICENSE))
- [OSS-Fuzz](https://github.com/google/oss-fuzz-vulns) ([CC-BY 4.0](https://github.com/google/oss-fuzz-vulns/blob/main/LICENSE))
