import fs from 'fs-extra';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Transform, type TransformCallback, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createZstdDecompress } from 'node:zlib';
import { CompressStream } from 'zstd-napi';
import {
  type Ecosystem,
  type SplitEcosystem,
  type SplitFile,
  type SplitIndex,
  getSplitFileName,
  splitIndexSchema,
} from '@renovatebot/osv-offline-db';

/**
 * zstd level 19 with long-distance matching. A window of 2^27 bytes is the largest decoders accept without extra options.
 * Uses all cores, as `node:zlib` can't compress with several threads.
 */
const zstdParameters = {
  compressionLevel: 19,
  checksumFlag: true,
  enableLongDistanceMatching: true,
  windowLog: 27,
  nbWorkers: os.availableParallelism(),
};

/**
 * Passes the data through, computing its SHA-256 and size.
 */
class Digest extends Transform {
  private readonly hash = createHash('sha256');
  size = 0;

  override _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    this.hash.update(chunk);
    this.size += chunk.length;
    callback(null, chunk);
  }

  digest(): string {
    return this.hash.digest('hex');
  }
}

/**
 * Compresses `source` with zstd into `target`, and checks that `node:zlib` decompresses it to the source again.
 */
export async function compressFile(
  source: string,
  target: string
): Promise<SplitFile> {
  const sourceDigest = new Digest();
  const digest = new Digest();
  await pipeline(
    createReadStream(source),
    sourceDigest,
    new CompressStream(zstdParameters),
    digest,
    createWriteStream(target)
  );
  const uncompressedSha256 = sourceDigest.digest();
  await verifyCompressedFile(target, uncompressedSha256, sourceDigest.size);
  return {
    file: path.basename(target),
    sha256: digest.digest(),
    size: digest.size,
    uncompressedSize: sourceDigest.size,
  };
}

/**
 * Decompresses `file` with `node:zlib`, which clients use, and fails when it doesn't match the expected content.
 */
export async function verifyCompressedFile(
  file: string,
  sha256: string,
  size: number
): Promise<void> {
  const digest = new Digest();
  await pipeline(
    createReadStream(file),
    createZstdDecompress(),
    digest,
    new Writable({ write: (_chunk, _encoding, callback) => callback() })
  );
  if (digest.digest() !== sha256 || digest.size !== size) {
    throw new Error(`${path.basename(file)} doesn't decompress to its source`);
  }
}

/**
 * Compresses the database and the index of an ecosystem into `directory`, named with `version`.
 */
export async function writeSplitFiles(
  directory: string,
  ecosystem: Ecosystem,
  version: string,
  [databasePath, indexPath]: [database: string, index: string]
): Promise<SplitEcosystem> {
  await fs.ensureDir(directory);
  return {
    database: await compressFile(
      databasePath,
      path.join(directory, getSplitFileName(ecosystem, 'database', version))
    ),
    index: await compressFile(
      indexPath,
      path.join(directory, getSplitFileName(ecosystem, 'index', version))
    ),
  };
}

/**
 * Writes the `index.json` of the split format to `indexPath`.
 */
export async function writeSplitIndex(
  indexPath: string,
  ecosystems: SplitIndex['ecosystems'],
  generated: Date,
  baseUrl: string
): Promise<SplitIndex> {
  const index: SplitIndex = {
    schema: splitIndexSchema,
    generated: generated.toISOString(),
    baseUrl,
    ecosystems,
  };
  await fs.outputFile(indexPath, JSON.stringify(index), 'utf8');
  return index;
}
