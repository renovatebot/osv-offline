import type { Ecosystem } from './ecosystem.ts';

// https://github.com/google/osv.dev/blob/27756cecae256ba0c024101048f152c341fb1e95/osv/purl_helpers.py#L26-L109
const PURL_ECOSYSTEMS: Record<Ecosystem, string> = {
  'crates.io': 'cargo',
  Go: 'golang',
  Hackage: 'hackage',
  Hex: 'hex',
  Julia: 'julia',
  Maven: 'maven',
  NuGet: 'nuget',
  npm: 'npm',
  Packagist: 'composer',
  PyPI: 'pypi',
  Pub: 'pub',
  RubyGems: 'gem',
} as const;

function urlEncode(packageName: string): string {
  const parts = packageName.split('/');
  return parts.map(encodeURIComponent).join('/');
}

export function packageToPurl(ecosystem: Ecosystem, packageName: string): string {
  let packageNamePurl = packageName;
  const purlType = PURL_ECOSYSTEMS[ecosystem];

  if (purlType === 'maven') {
    packageNamePurl = packageName.replace(':', '/');
  }

  return `pkg:${purlType}/${urlEncode(packageNamePurl)}`;
}

/**
 * Returns the purl without its qualifiers and subpath.
 * OSV qualifies some purls, as with the registry in `pkg:composer/drupal/token?repository_url=https:%2F%2Fpackages.drupal.org%2F8`.
 */
export function purlWithoutQualifiers(purl: string): string {
  return purl.replace(/[?#].*$/, '');
}
