import { describe, expect, it } from 'vitest';
import {
  DatabaseIndexBuilder,
  type DatabaseRecord,
  getIndexFileName,
  parseIndex,
} from './db-index.ts';

function record(id: string, ...names: string[]): DatabaseRecord {
  return {
    id,
    modified: '2026-10-27T00:00:00Z',
    affected: names.map((name) => ({
      package: { name, ecosystem: 'npm', purl: `pkg:npm/${name}` },
    })),
    _id: `_${id}`,
  };
}

describe('packages/osv-offline-db/src/lib/db-index.unit', () => {
  describe('getIndexFileName', () => {
    it('uses the lower-case ecosystem', () => {
      expect(getIndexFileName('PyPI')).toBe('pypi.idx.json');
    });
  });

  describe('DatabaseIndexBuilder', () => {
    it('indexes each package once per record', () => {
      const builder = new DatabaseIndexBuilder();
      const line1 = JSON.stringify(record('A', 'foo', 'foo', 'bar'));
      const line2 = JSON.stringify(record('B', 'foo'));

      builder.add(line1, JSON.parse(line1) as DatabaseRecord);
      builder.add(line2, JSON.parse(line2) as DatabaseRecord);

      expect(builder.index).toEqual(
        new Map([
          [
            'foo',
            [
              { offset: 0, length: line1.length },
              { offset: line1.length + 1, length: line2.length },
            ],
          ],
          ['bar', [{ offset: 0, length: line1.length }]],
        ])
      );
    });

    it('skips malformed lines and records without affected packages', () => {
      const builder = new DatabaseIndexBuilder();
      const line = JSON.stringify(record('A', 'foo'));

      builder.add('not json');
      builder.add('{}', {} as DatabaseRecord);
      builder.add(line, JSON.parse(line) as DatabaseRecord);

      expect(builder.index).toEqual(
        new Map([['foo', [{ offset: 12, length: line.length }]]])
      );
    });

    it('counts bytes, not characters', () => {
      const builder = new DatabaseIndexBuilder();
      const line1 = JSON.stringify({ ...record('A', 'foo'), summary: 'ä' });
      const line2 = JSON.stringify(record('B', 'foo'));

      builder.add(line1, JSON.parse(line1) as DatabaseRecord);
      builder.add(line2, JSON.parse(line2) as DatabaseRecord);

      expect(builder.index.get('foo')?.[1]).toEqual({
        offset: Buffer.byteLength(line1) + 1,
        length: line2.length,
      });
    });

    it('serializes the size, the last record and the packages', () => {
      const builder = new DatabaseIndexBuilder();
      const line = JSON.stringify(record('A', 'foo'));
      builder.add(line, JSON.parse(line) as DatabaseRecord);

      expect(JSON.parse(builder.serialize())).toEqual({
        size: line.length + 1,
        last: { offset: 0, length: line.length, id: '_A' },
        packages: { foo: [[0, line.length]] },
      });
    });

    it('omits the last record without an _id', () => {
      const builder = new DatabaseIndexBuilder();
      const withoutId = { ...record('A', 'foo'), _id: undefined };
      const line = JSON.stringify(withoutId);
      builder.add(line, withoutId);

      expect(JSON.parse(builder.serialize())).not.toHaveProperty('last');
    });
  });

  describe('parseIndex', () => {
    it('parses an index built from a database of the given size', () => {
      const builder = new DatabaseIndexBuilder();
      const line = JSON.stringify(record('A', 'foo'));
      builder.add(line, JSON.parse(line) as DatabaseRecord);

      expect(parseIndex(builder.serialize(), line.length + 1)).toEqual({
        index: builder.index,
        last: { offset: 0, length: line.length, id: '_A' },
      });
    });

    it.each`
      content                         | size
      ${'not json'}                   | ${1}
      ${'null'}                       | ${1}
      ${'{"size":2,"packages":{}}'}   | ${1}
      ${'{"size":1,"packages":null}'} | ${1}
    `('returns null for $content', ({ content, size }) => {
      expect(parseIndex(content as string, size as number)).toBeNull();
    });
  });
});
