import type { Ecosystem } from './ecosystem';

// https://github.com/google/osv.dev/blob/edacbd3c32b1d632bad8c5b506a14d0850b2e537/osv/purl_helpers.py#L18-L30
const PURL_ECOSYSTEMS: Record<Ecosystem, string> = {
  'crates.io': 'cargo',
  Go: 'golang',
  Maven: 'maven',
  NuGet: 'nuget',
  npm: 'npm',
  PyPI: 'pypi',
  RubyGems: 'gem',
} as const;

function urlEncode(packageName: string): string {
  const parts = packageName.split('/');
  return parts.map(encodeURIComponent).join('/');
}

export function packageToPurl(
  ecosystem: Ecosystem,
  packageName: string
): string {
  let packageNamePurl = packageName;
  const purlType = PURL_ECOSYSTEMS[ecosystem];

  if (purlType === 'maven') {
    packageNamePurl = packageName.replace(':', '/');
  }

  return `pkg:${purlType}/${urlEncode(packageNamePurl)}`;
}
