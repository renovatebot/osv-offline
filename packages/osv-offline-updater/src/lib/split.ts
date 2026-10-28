import fs from 'fs-extra';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import path from 'node:path';
import { Transform, type TransformCallback } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { constants, createZstdCompress } from 'node:zlib';
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
 */
const zstdParams = {
  [constants.ZSTD_c_compressionLevel]: 19,
  [constants.ZSTD_c_checksumFlag]: 1,
  [constants.ZSTD_c_enableLongDistanceMatching]: 1,
  [constants.ZSTD_c_windowLog]: 27,
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
 * Compresses `source` with zstd into `target`.
 */
export async function compressFile(
  source: string,
  target: string
): Promise<SplitFile> {
  const { size: uncompressedSize } = await fs.stat(source);
  const digest = new Digest();
  await pipeline(
    createReadStream(source),
    createZstdCompress({ params: zstdParams }),
    digest,
    createWriteStream(target)
  );
  return {
    file: path.basename(target),
    sha256: digest.digest(),
    size: digest.size,
    uncompressedSize,
  };
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
