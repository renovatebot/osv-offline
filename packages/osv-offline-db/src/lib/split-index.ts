import { type Ecosystem, ecosystems } from './ecosystem.ts';

/** the version of the split index format, see {@link SplitIndex} */
export const splitIndexSchema = 2;

/**
 * A compressed file of the split format.
 */
export interface SplitFile {
  /** file name, relative to {@link SplitIndex.baseUrl} or the index URL */
  readonly file: string;
  /** SHA-256 of the compressed file, as hex */
  readonly sha256: string;
  /** size of the compressed file in bytes */
  readonly size: number;
  /** size of the decompressed file in bytes */
  readonly uncompressedSize: number;
}

/**
 * The files of an ecosystem: its database (`.nedb`) and its precomputed index (`.idx.json`), each compressed with zstd.
 */
export interface SplitEcosystem {
  readonly database: SplitFile;
  readonly index: SplitFile;
}

/**
 * The `index.json` of the split format, which lists the current files of each ecosystem.
 */
export interface SplitIndex {
  readonly schema: typeof splitIndexSchema;
  /** when the files were generated, as ISO 8601 */
  readonly generated: string;
  /** base URL of the files; without it, they are relative to the index URL */
  readonly baseUrl?: string;
  readonly ecosystems: Partial<Record<Ecosystem, SplitEcosystem>>;
}

/**
 * Returns the file name of a compressed database or index of the split format, e.g. `npm-20261027120513.nedb.zst`.
 */
export function getSplitFileName(
  ecosystem: Ecosystem,
  kind: keyof SplitEcosystem,
  version: string,
): string {
  const extension = kind === 'database' ? 'nedb' : 'idx.json';
  return `${ecosystem.toLowerCase()}-${version}.${extension}.zst`;
}

function isSplitFile(value: unknown): value is SplitFile {
  const file = value as Partial<SplitFile> | null;
  return (
    typeof file?.file === 'string' &&
    // a plain file name, not a path or URL
    /^[\w.-]+$/.test(file.file) &&
    typeof file.sha256 === 'string' &&
    /^[0-9a-f]{64}$/.test(file.sha256) &&
    Number.isSafeInteger(file.size) &&
    Number.isSafeInteger(file.uncompressedSize)
  );
}

/**
 * Parses an `index.json` of the split format.
 *
 * @returns the index, or `null` when it isn't valid or has another schema version
 */
export function parseSplitIndex(content: string): SplitIndex | null {
  let index: Partial<SplitIndex> | null;
  try {
    index = JSON.parse(content) as Partial<SplitIndex> | null;
  } catch {
    return null;
  }
  if (
    index?.schema !== splitIndexSchema ||
    typeof index.generated !== 'string' ||
    (index.baseUrl !== undefined && typeof index.baseUrl !== 'string') ||
    typeof index.ecosystems !== 'object' ||
    index.ecosystems === null
  ) {
    return null;
  }
  const valid = Object.entries(index.ecosystems).every(
    ([ecosystem, files]) =>
      (ecosystems as readonly string[]).includes(ecosystem) &&
      isSplitFile(files?.database) &&
      isSplitFile(files.index),
  );
  return valid ? (index as SplitIndex) : null;
}
