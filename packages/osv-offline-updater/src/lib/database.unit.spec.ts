import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import type { Osv } from '@renovatebot/osv-offline-db';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { writeDatabase } from './database.ts';

function vulnerability(id: string, ...names: string[]): Osv.Vulnerability {
  return {
    id,
    modified: '2026-10-27T00:00:00Z',
    // a multi-byte character, so byte offsets differ from character offsets
    summary: `Vulnerability ${id} – affects ${names.join(', ')}`,
    affected: names.map((name) => ({
      package: { name, ecosystem: 'npm', purl: `pkg:npm/${name}` },
    })),
  };
}

interface IndexFile {
  size: number;
  last: { offset: number; length: number; id: string };
  packages: Record<string, [number, number][]>;
}

describe('packages/osv-offline-updater/src/lib/database.unit', () => {
  describe('writeDatabase', () => {
    let directory: string;

    beforeEach(async () => {
      directory = await fs.mkdtemp(
        path.join(os.tmpdir(), 'osv-offline-updater-')
      );
    });

    afterEach(async () => {
      await fs.remove(directory);
    });

    it('writes one record per line with an _id', async () => {
      const vulnerabilities = [
        vulnerability('VULN-1', 'foo'),
        vulnerability('VULN-2', 'bar'),
      ];

      const [databasePath, indexPath] = await writeDatabase(
        directory,
        'npm',
        vulnerabilities
      );

      expect(databasePath).toBe(path.join(directory, 'npm.nedb'));
      expect(indexPath).toBe(path.join(directory, 'npm.idx.json'));
      const lines = (await fs.readFile(databasePath, 'utf8'))
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line) as Osv.Vulnerability & { _id: string });
      expect(lines).toMatchObject(vulnerabilities);
      expect(lines.map(({ _id }) => _id)).toEqual([
        expect.stringMatching(/^[\w-]{16}$/),
        expect.stringMatching(/^[\w-]{16}$/),
      ]);
    });

    it('writes an index which points at the records of each package', async () => {
      const [databasePath, indexPath] = await writeDatabase(directory, 'npm', [
        vulnerability('VULN-1', 'foo', 'bar'),
        vulnerability('VULN-2', 'foo'),
      ]);

      const database = await fs.readFile(databasePath);
      const index = JSON.parse(
        await fs.readFile(indexPath, 'utf8')
      ) as IndexFile;
      const read = (offset: number, length: number) =>
        JSON.parse(
          database.subarray(offset, offset + length).toString('utf8')
        ) as Osv.Vulnerability & { _id: string };

      expect(index.size).toBe(database.length);
      expect(
        Object.fromEntries(
          Object.entries(index.packages).map(([name, pointers]) => [
            name,
            pointers.map(([offset, length]) => read(offset, length).id),
          ])
        )
      ).toEqual({ foo: ['VULN-1', 'VULN-2'], bar: ['VULN-1'] });
      expect(read(index.last.offset, index.last.length)._id).toBe(
        index.last.id
      );
    });

    it('writes more records than fit into the write buffer', async () => {
      const vulnerabilities = Array.from({ length: 2000 }, (_, i) =>
        vulnerability(`VULN-${i}`, 'foo')
      );

      const [databasePath, indexPath] = await writeDatabase(
        directory,
        'npm',
        vulnerabilities
      );

      const lines = (await fs.readFile(databasePath, 'utf8'))
        .split('\n')
        .filter(Boolean);
      const index = JSON.parse(
        await fs.readFile(indexPath, 'utf8')
      ) as IndexFile;
      expect(lines).toHaveLength(2000);
      expect(index.packages.foo).toHaveLength(2000);
    });

    it('writes the records of an async iterable as they are read', async () => {
      const [databasePath, indexPath] = await writeDatabase(
        directory,
        'npm',
        Readable.from([
          vulnerability('VULN-1', 'foo'),
          vulnerability('VULN-2', 'bar'),
        ])
      );

      const lines = (await fs.readFile(databasePath, 'utf8'))
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line) as Osv.Vulnerability);
      const index = JSON.parse(
        await fs.readFile(indexPath, 'utf8')
      ) as IndexFile;
      expect(lines.map(({ id }) => id)).toEqual(['VULN-1', 'VULN-2']);
      expect(Object.keys(index.packages)).toEqual(['foo', 'bar']);
    });

    it('replaces existing files', async () => {
      await writeDatabase(directory, 'npm', [vulnerability('OLD', 'foo')]);

      const [databasePath] = await writeDatabase(directory, 'npm', [
        vulnerability('NEW', 'foo'),
      ]);

      const content = await fs.readFile(databasePath, 'utf8');
      expect(content).toContain('"id":"NEW"');
      expect(content).not.toContain('"id":"OLD"');
    });
  });
});
