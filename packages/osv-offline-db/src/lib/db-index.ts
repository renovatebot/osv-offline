import type { Ecosystem } from './ecosystem.ts';
import type { Vulnerability } from './osv.ts';

export interface RecordPointer {
  readonly offset: number;
  readonly length: number;
}

export type EcosystemIndex = Map<string, RecordPointer[]>;

/**
 * A record of an ecosystem database, with the `_id` the updater adds.
 */
export type DatabaseRecord = Vulnerability & { _id?: string };

/**
 * The last record of the database an index was built from, to check that the index still matches it.
 */
export interface IndexCheck extends RecordPointer {
  readonly id: string;
}

interface IndexFile {
  /** byte size of the database the index was built from */
  size: number;
  last?: IndexCheck;
  /** package name -> `[offset, length][]` of its records */
  packages: Record<string, [number, number][]>;
}

/**
 * Returns the file name of the precomputed index of an ecosystem database.
 */
export function getIndexFileName(ecosystem: Ecosystem): string {
  return `${ecosystem.toLowerCase()}.idx.json`;
}

/**
 * Builds the index of an ecosystem database line by line, as the updater writes it and `OsvOfflineDb` reads it.
 */
export class DatabaseIndexBuilder {
  readonly index: EcosystemIndex = new Map();
  private size = 0;
  private last: IndexCheck | undefined;

  /**
   * Adds the next line of the database, with its parsed record, or without one for a malformed line.
   */
  add(line: string, record?: DatabaseRecord): void {
    const pointer = { offset: this.size, length: Buffer.byteLength(line) };
    // a record can affect the same package more than once
    const names = new Set(
      (record?.affected ?? [])
        .map((affected) => affected.package?.name)
        .filter((name): name is string => !!name),
    );
    for (const name of names) {
      let pointers = this.index.get(name);
      if (!pointers) {
        pointers = [];
        this.index.set(name, pointers);
      }
      pointers.push(pointer);
    }
    this.last = record?._id ? { ...pointer, id: record._id } : undefined;
    // each line ends with a line break
    this.size += pointer.length + 1;
  }

  /**
   * Returns the index file content.
   */
  serialize(): string {
    const file: IndexFile = {
      size: this.size,
      ...(this.last && { last: this.last }),
      packages: Object.fromEntries(
        Array.from(this.index, ([name, pointers]) => [
          name,
          pointers.map(({ offset, length }): [number, number] => [offset, length]),
        ]),
      ),
    };
    return JSON.stringify(file);
  }
}

/**
 * Parses an index file, returning `null` when it isn't one or was built from a database of another size.
 *
 * @returns the index, and the last record to check against the database
 */
export function parseIndex(
  content: string,
  size: number,
): { index: EcosystemIndex; last: IndexCheck | undefined } | null {
  let file: IndexFile;
  try {
    file = JSON.parse(content) as IndexFile;
  } catch {
    return null;
  }
  if (file?.size !== size || typeof file.packages !== 'object' || file.packages === null) {
    return null;
  }
  const index: EcosystemIndex = new Map(
    Object.entries(file.packages).map(([name, pointers]) => [
      name,
      pointers.map(([offset, length]) => ({ offset, length })),
    ]),
  );
  return { index, last: file.last };
}
