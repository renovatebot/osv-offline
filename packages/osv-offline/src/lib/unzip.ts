import { createReadStream, createWriteStream } from 'node:fs';
import { type FileHandle, open } from 'node:fs/promises';
import path from 'node:path';
import { Readable, Transform, type TransformCallback } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { crc32, createInflateRaw } from 'node:zlib';

const endOfCentralDirectorySignature = 0x06054b50;
const centralDirectoryHeaderSignature = 0x02014b50;
const localFileHeaderSignature = 0x04034b50;

const endOfCentralDirectorySize = 22;
const centralDirectoryHeaderSize = 46;
const localFileHeaderSize = 30;
// the end of central directory record ends with a comment of up to 65535 bytes
const maxEndOfCentralDirectorySize = endOfCentralDirectorySize + 0xffff;

const compressionStored = 0;
const compressionDeflated = 8;

interface ZipEntry {
  readonly name: string;
  readonly method: number;
  readonly crc: number;
  readonly compressedSize: number;
  readonly size: number;
  readonly localHeaderOffset: number;
}

/**
 * Extracts the files of a zip archive into `targetDir`, streaming each one through `node:zlib`.
 *
 * Only supports stored or deflated files in the root of an archive without ZIP64 extensions or encryption.
 *
 * @returns the names of the extracted files
 */
export async function extractZip(
  zipPath: string,
  targetDir: string
): Promise<string[]> {
  const file = await open(zipPath, 'r');
  try {
    const entries = await readEntries(file);
    for (const entry of entries) {
      await extractEntry(
        file,
        zipPath,
        entry,
        path.join(targetDir, entry.name)
      );
    }
    return entries.map((entry) => entry.name);
  } finally {
    await file.close();
  }
}

async function readEntries(file: FileHandle): Promise<ZipEntry[]> {
  const { size } = await file.stat();
  const tailSize = Math.min(size, maxEndOfCentralDirectorySize);
  const tail = Buffer.alloc(tailSize);
  await file.read(tail, 0, tailSize, size - tailSize);

  let eocd = tailSize - endOfCentralDirectorySize;
  while (
    eocd >= 0 &&
    tail.readUInt32LE(eocd) !== endOfCentralDirectorySignature
  ) {
    eocd--;
  }
  if (eocd < 0) {
    throw new Error('Invalid zip archive: end of central directory not found');
  }

  const entryCount = tail.readUInt16LE(eocd + 10);
  const centralDirectorySize = tail.readUInt32LE(eocd + 12);
  const centralDirectoryOffset = tail.readUInt32LE(eocd + 16);
  if (entryCount === 0xffff || centralDirectoryOffset === 0xffffffff) {
    throw new Error('Unsupported zip archive: ZIP64 extensions');
  }

  const centralDirectory = Buffer.alloc(centralDirectorySize);
  await file.read(
    centralDirectory,
    0,
    centralDirectorySize,
    centralDirectoryOffset
  );

  const entries: ZipEntry[] = [];
  let offset = 0;
  for (let i = 0; i < entryCount; i++) {
    if (
      centralDirectory.readUInt32LE(offset) !== centralDirectoryHeaderSignature
    ) {
      throw new Error('Invalid zip archive: corrupt central directory');
    }
    const flags = centralDirectory.readUInt16LE(offset + 8);
    const method = centralDirectory.readUInt16LE(offset + 10);
    const crc = centralDirectory.readUInt32LE(offset + 16);
    const compressedSize = centralDirectory.readUInt32LE(offset + 20);
    const size = centralDirectory.readUInt32LE(offset + 24);
    const nameLength = centralDirectory.readUInt16LE(offset + 28);
    const extraLength = centralDirectory.readUInt16LE(offset + 30);
    const commentLength = centralDirectory.readUInt16LE(offset + 32);
    const localHeaderOffset = centralDirectory.readUInt32LE(offset + 42);
    const nameStart = offset + centralDirectoryHeaderSize;
    const name = centralDirectory.toString(
      'utf8',
      nameStart,
      nameStart + nameLength
    );
    offset = nameStart + nameLength + extraLength + commentLength;

    if (name.endsWith('/')) {
      // directory entry
      continue;
    }
    if (
      name.includes('/') ||
      name.includes('\\') ||
      name === '.' ||
      name === '..'
    ) {
      throw new Error(`Unsupported zip entry name: ${name}`);
    }
    if (flags & 0x1) {
      throw new Error(`Unsupported zip entry: ${name} is encrypted`);
    }
    if (method !== compressionStored && method !== compressionDeflated) {
      throw new Error(
        `Unsupported zip entry: ${name} uses compression method ${method}`
      );
    }
    entries.push({
      name,
      method,
      crc,
      compressedSize,
      size,
      localHeaderOffset,
    });
  }
  return entries;
}

async function extractEntry(
  file: FileHandle,
  zipPath: string,
  entry: ZipEntry,
  targetPath: string
): Promise<void> {
  const header = Buffer.alloc(localFileHeaderSize);
  await file.read(header, 0, localFileHeaderSize, entry.localHeaderOffset);
  if (header.readUInt32LE(0) !== localFileHeaderSignature) {
    throw new Error(`Invalid zip archive: corrupt header of ${entry.name}`);
  }
  // the local header's name and extra field can differ in length from the central directory's
  const dataOffset =
    entry.localHeaderOffset +
    localFileHeaderSize +
    header.readUInt16LE(26) +
    header.readUInt16LE(28);

  // a read stream can't cover an empty range
  const source =
    entry.compressedSize > 0
      ? createReadStream(zipPath, {
          start: dataOffset,
          end: dataOffset + entry.compressedSize - 1,
        })
      : Readable.from([]);
  const verifier = new ChecksumVerifier(entry);
  const target = createWriteStream(targetPath);

  if (entry.method === compressionDeflated) {
    await pipeline(source, createInflateRaw(), verifier, target);
  } else {
    await pipeline(source, verifier, target);
  }
}

/**
 * Passes the data through, and fails when its size or CRC-32 differs from the zip entry's.
 */
class ChecksumVerifier extends Transform {
  private crc = 0;
  private size = 0;

  constructor(private readonly entry: ZipEntry) {
    super();
  }

  override _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    this.crc = crc32(chunk, this.crc);
    this.size += chunk.length;
    callback(null, chunk);
  }

  override _flush(callback: TransformCallback): void {
    if (this.size !== this.entry.size || this.crc !== this.entry.crc) {
      callback(
        new Error(
          `Invalid zip archive: checksum mismatch for ${this.entry.name}`
        )
      );
      return;
    }
    callback();
  }
}
