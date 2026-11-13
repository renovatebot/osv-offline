// https://github.com/google/osv.dev/blob/27756cecae256ba0c024101048f152c341fb1e95/osv/ecosystems/_ecosystems.py#L40-L91
export const ecosystems = [
  'crates.io',
  'Go',
  'Hackage',
  'Hex',
  'Julia',
  'Maven',
  'npm',
  'NuGet',
  'Packagist',
  'Pub',
  'PyPI',
  'RubyGems',
] as const;
export type Ecosystem = (typeof ecosystems)[number];
