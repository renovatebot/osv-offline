https://github.com/google/osv.dev/blob/b8ec0096f93f062993dee57f8b902f257993be88/osv/ecosystems/_ecosystems.py#L38-L68
export const ecosystems = [
  'crates.io',
  'Go',
  'Hackage',
  'Hex',
  'Maven',
  'npm',
  'NuGet',
  'Packagist',
  'Pub',
  'PyPI',
  'RubyGems',
] as const;
export type Ecosystem = typeof ecosystems[number];
