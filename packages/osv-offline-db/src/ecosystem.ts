/**
 * https://github.com/google/osv/blob/b9f0d1c1b377b0ab5804808f24032be965a571b8/lib/osv/ecosystems.py#L313-L321
 */
export const ecosystems = [
  'crates.io',
  'Go',
  'Maven',
  'npm',
  'NuGet',
  'PyPI',
  'RubyGems',
] as const;
export type Ecosystem = typeof ecosystems[number];
