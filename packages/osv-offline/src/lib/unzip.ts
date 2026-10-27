import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { Transform, type TransformCallback } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { crc32 } from 'node:zlib';
import { type Entry, openPromise } from 'yauzl';

/**
 * Extracts the files of a zip archive into `targetDir`, streaming each one to disk and verifying its CRC-32.
 *
 * Only supports files in the root of the archive.
 *
 * @returns the names of the extracted files
 */
export async function extractZip(
  zipPath: string,
  targetDir: string
): Promise<string[]> {
  const zipFile = await openPromise(zipPath, {
    lazyEntries: true,
    autoClose: false,
  });
  try {
    const files: string[] = [];
    for await (const entry of zipFile.eachEntry()) {
      if (entry.fileName.endsWith('/')) {
        // directory entry
        continue;
      }
      if (entry.fileName.includes('/')) {
        throw new Error(`Unsupported zip entry name: ${entry.fileName}`);
      }
      await pipeline(
        await zipFile.openReadStreamPromise(entry),
        new Crc32Verifier(entry),
        createWriteStream(path.join(targetDir, entry.fileName))
      );
      files.push(entry.fileName);
    }
    return files;
  } finally {
    zipFile.close();
  }
}

/**
 * Passes the data through, and fails when its CRC-32 differs from the zip entry's.
 *
 * yauzl only verifies the size of an entry.
 *
 * @see https://github.com/thejoshwolfe/yauzl/issues/49
 */
class Crc32Verifier extends Transform {
  private crc = 0;

  constructor(private readonly entry: Entry) {
    super();
  }

  override _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    this.crc = crc32(chunk, this.crc);
    callback(null, chunk);
  }

  override _flush(callback: TransformCallback): void {
    if (this.crc !== this.entry.crc32) {
      callback(new Error(`CRC-32 mismatch for ${this.entry.fileName}`));
      return;
    }
    callback();
  }
}
