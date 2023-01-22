// https://github.com/google/osv.dev/blob/edacbd3c32b1d632bad8c5b506a14d0850b2e537/osv/ecosystems.py#L659-L679
export const ecosystems = [
  'crates.io',
  'Go',
  'Hex',
  'Maven',
  'npm',
  'NuGet',
  'Packagist',
  'PyPI',
  'RubyGems',
] as const;
export type Ecosystem = typeof ecosystems[number];
