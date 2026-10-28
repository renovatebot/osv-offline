import fs from 'fs-extra';
import { createWriteStream } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { finished } from 'node:stream/promises';
import path from 'node:path';
import {
  DatabaseIndexBuilder,
  type DatabaseRecord,
  type Ecosystem,
  type Osv,
  getIndexFileName,
} from '@renovatebot/osv-offline-db';

function generateId(): string {
  return randomBytes(12).toString('base64url').slice(0, 16);
}

/**
 * Writes the database of an ecosystem, one record per line, and its precomputed index into `directory`, replacing existing files.
 * The vulnerabilities are written as they are read, so they don't have to fit into memory at once.
 *
 * @returns the paths of the database and of the index
 */
export async function writeDatabase(
  directory: string,
  ecosystem: Ecosystem,
  vulnerabilities:
    AsyncIterable<Osv.Vulnerability> | Iterable<Osv.Vulnerability>
): Promise<[database: string, index: string]> {
  const databasePath = path.join(directory, `${ecosystem.toLowerCase()}.nedb`);
  const indexPath = path.join(directory, getIndexFileName(ecosystem));

  const out = createWriteStream(databasePath, { encoding: 'utf8' });
  // a precomputed index saves clients from scanning the whole database
  const index = new DatabaseIndexBuilder();
  for await (const vuln of vulnerabilities) {
    const record: DatabaseRecord = { ...vuln, _id: generateId() };
    const line = JSON.stringify(record);
    index.add(line, record);
    if (!out.write(`${line}\n`)) {
      await new Promise<void>((resolve) => out.once('drain', resolve));
    }
  }
  out.end();
  await finished(out);

  await fs.writeFile(indexPath, index.serialize(), 'utf8');

  return [databasePath, indexPath];
}
