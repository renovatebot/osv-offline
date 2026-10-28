import { parseSplitIndex } from '@renovatebot/osv-offline-db';
import fs from 'fs-extra';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { zstdCompressSync, zstdDecompressSync } from 'node:zlib';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  compressFile,
  verifyCompressedFile,
  writeSplitFiles,
  writeSplitIndex,
} from './split.ts';

describe('packages/osv-offline-updater/src/lib/split.unit', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'osv-offline-split-'));
  });

  afterEach(async () => {
    await fs.remove(directory);
  });

  describe('compressFile', () => {
    it('compresses with zstd and returns size and checksum', async () => {
      const source = path.join(directory, 'npm.nedb');
      const content = '{"id":"GHSA-1","summary":"ä"}\n'.repeat(1000);
      await fs.writeFile(source, content);
      const target = path.join(directory, 'npm-20261027120513.nedb.zst');

      const file = await compressFile(source, target);

      const compressed = await fs.readFile(target);
      expect(zstdDecompressSync(compressed).toString('utf8')).toBe(content);
      expect(file).toEqual({
        file: 'npm-20261027120513.nedb.zst',
        sha256: createHash('sha256').update(compressed).digest('hex'),
        size: compressed.length,
        uncompressedSize: Buffer.byteLength(content),
      });
    });

    it('compresses an empty file', async () => {
      const source = path.join(directory, 'pub.nedb');
      await fs.writeFile(source, '');
      const target = path.join(directory, 'pub-20261027120513.nedb.zst');

      const file = await compressFile(source, target);

      expect(zstdDecompressSync(await fs.readFile(target)).length).toBe(0);
      expect(file.uncompressedSize).toBe(0);
    });
  });

  describe('verifyCompressedFile', () => {
    const content = Buffer.from('{"id":"GHSA-1"}\n');
    const sha256 = createHash('sha256').update(content).digest('hex');
    let file: string;

    beforeEach(async () => {
      file = path.join(directory, 'npm.nedb.zst');
      await fs.writeFile(file, zstdCompressSync(content));
    });

    it('accepts a file which decompresses to the expected content', async () => {
      await expect(
        verifyCompressedFile(file, sha256, content.length)
      ).resolves.toBeUndefined();
    });

    it.each([
      ['checksum', '0'.repeat(64), content.length],
      ['size', sha256, content.length + 1],
    ] as const)(
      'rejects a file with another %s',
      async (_, expectedSha256, expectedSize) => {
        await expect(
          verifyCompressedFile(file, expectedSha256, expectedSize)
        ).rejects.toThrow("npm.nedb.zst doesn't decompress to its source");
      }
    );
  });

  describe('writeSplitFiles', () => {
    it('compresses the database and the index with versioned names', async () => {
      const databasePath = path.join(directory, 'pypi.nedb');
      const indexPath = path.join(directory, 'pypi.idx.json');
      await fs.writeFile(databasePath, '{"id":"PYSEC-1"}\n');
      await fs.writeFile(indexPath, '{"size":17,"packages":{}}');
      const splitDir = path.join(directory, 'split');

      const files = await writeSplitFiles(splitDir, 'PyPI', '20261027120513', [
        databasePath,
        indexPath,
      ]);

      expect(files.database.file).toBe('pypi-20261027120513.nedb.zst');
      expect(files.index.file).toBe('pypi-20261027120513.idx.json.zst');
      expect(
        zstdDecompressSync(
          await fs.readFile(path.join(splitDir, files.index.file))
        ).toString('utf8')
      ).toBe('{"size":17,"packages":{}}');
    });
  });

  describe('writeSplitIndex', () => {
    it('writes a valid index', async () => {
      const source = path.join(directory, 'npm.nedb');
      await fs.writeFile(source, '{"id":"GHSA-1"}\n');
      const file = await compressFile(
        source,
        path.join(directory, 'npm-20261027120513.nedb.zst')
      );
      const indexPath = path.join(directory, 'pages', 'v2', 'index.json');

      const index = await writeSplitIndex(
        indexPath,
        { npm: { database: file, index: file } },
        new Date('2026-10-27T12:00:00Z'),
        'https://example.com/files/'
      );

      expect(index).toEqual({
        schema: 2,
        generated: '2026-10-27T12:00:00.000Z',
        baseUrl: 'https://example.com/files/',
        ecosystems: { npm: { database: file, index: file } },
      });
      expect(parseSplitIndex(await fs.readFile(indexPath, 'utf8'))).toEqual(
        index
      );
    });
  });
});
