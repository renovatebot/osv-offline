import { Transform, type TransformCallback } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { crc32 } from 'node:zlib';
import type { Osv } from '@renovatebot/osv-offline-db';
import { type Entry, openPromise } from 'yauzl';

/**
 * Reads the vulnerabilities of an OSV `all.zip` one entry at a time, verifying the CRC-32 of each.
 */
export async function* readVulnerabilities(zipPath: string): AsyncGenerator<Osv.Vulnerability> {
  const zipFile = await openPromise(zipPath, {
    lazyEntries: true,
    autoClose: false,
  });
  try {
    for await (const entry of zipFile.eachEntry()) {
      const chunks: Buffer[] = [];
      await pipeline(
        await zipFile.openReadStreamPromise(entry),
        new Crc32Verifier(entry),
        async (source: AsyncIterable<Buffer>) => {
          for await (const chunk of source) {
            chunks.push(chunk);
          }
        },
      );
      yield JSON.parse(Buffer.concat(chunks).toString('utf8')) as Osv.Vulnerability;
    }
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
  private readonly entry: Entry;

  constructor(entry: Entry) {
    super();
    this.entry = entry;
  }

  override _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void {
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
