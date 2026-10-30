import { describe, expect, it } from 'vitest';
import { type SplitIndex, getSplitFileName, parseSplitIndex } from './split-index.ts';

const sha256 = 'a'.repeat(64);

const index: SplitIndex = {
  schema: 2,
  generated: '2026-10-27T12:00:00Z',
  baseUrl: 'https://github.com/renovatebot/osv-offline/releases/download/database/',
  ecosystems: {
    npm: {
      database: {
        file: 'npm-20261027120513.nedb.zst',
        sha256,
        size: 30198989,
        uncompressedSize: 394263607,
      },
      index: {
        file: 'npm-20261027120513.idx.json.zst',
        sha256,
        size: 2411724,
        uncompressedSize: 9646899,
      },
    },
  },
};

describe('packages/osv-offline-db/src/lib/split-index.unit', () => {
  describe('getSplitFileName', () => {
    it.each([
      ['npm', 'database', 'npm-20261027120513.nedb.zst'],
      ['PyPI', 'index', 'pypi-20261027120513.idx.json.zst'],
      ['crates.io', 'database', 'crates.io-20261027120513.nedb.zst'],
    ] as const)('returns the name of %s %s', (ecosystem, kind, expected) => {
      expect(getSplitFileName(ecosystem, kind, '20261027120513')).toBe(expected);
    });
  });

  describe('parseSplitIndex', () => {
    it('parses a valid index', () => {
      expect(parseSplitIndex(JSON.stringify(index))).toEqual(index);
    });

    it('parses an index without base URL', () => {
      const withoutBaseUrl = { ...index, baseUrl: undefined };

      expect(parseSplitIndex(JSON.stringify(withoutBaseUrl))).toEqual(withoutBaseUrl);
    });

    it.each`
      reason                       | content
      ${'invalid JSON'}            | ${'not json'}
      ${'null'}                    | ${'null'}
      ${'another schema'}          | ${JSON.stringify({ ...index, schema: 3 })}
      ${'no generation time'}      | ${JSON.stringify({ ...index, generated: 1 })}
      ${'invalid base URL'}        | ${JSON.stringify({ ...index, baseUrl: 1 })}
      ${'no ecosystems'}           | ${JSON.stringify({ ...index, ecosystems: null })}
      ${'an unknown ecosystem'}    | ${JSON.stringify({ ...index, ecosystems: { foo: index.ecosystems.npm } })}
      ${'a missing index file'}    | ${JSON.stringify({ ...index, ecosystems: { npm: { database: index.ecosystems.npm?.database } } })}
      ${'a file name with a path'} | ${JSON.stringify({ ...index, ecosystems: { npm: { ...index.ecosystems.npm, database: { ...index.ecosystems.npm?.database, file: '../npm.nedb.zst' } } } })}
      ${'an invalid checksum'}     | ${JSON.stringify({ ...index, ecosystems: { npm: { ...index.ecosystems.npm, index: { ...index.ecosystems.npm?.index, sha256: 'abc' } } } })}
      ${'an invalid size'}         | ${JSON.stringify({ ...index, ecosystems: { npm: { ...index.ecosystems.npm, index: { ...index.ecosystems.npm?.index, size: '1' } } } })}
    `('returns null for $reason', ({ content }) => {
      expect(parseSplitIndex(content as string)).toBeNull();
    });
  });
});
