import fs from 'fs-extra';
import { createWriteStream } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { finished } from 'node:stream/promises';
import {
  DatabaseIndexBuilder,
  type DatabaseRecord,
  OsvOfflineDb,
  ecosystems,
  getIndexFileName,
} from '@renovatebot/osv-offline-db';
import { GitHub } from './client/github.ts';
import signale from 'signale';
import { OsvDownloader } from './client/osv.ts';
import path from 'path';
import AdmZip from 'adm-zip';

function generateId(): string {
  return randomBytes(12).toString('base64url').slice(0, 16);
}

async function deleteIfExists(path: string): Promise<void> {
  try {
    await fs.remove(path);
    signale.info(`Deleted existing database at ${path}`);
  } catch {
    signale.info(`No existing database found at ${path}`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  if (!fs.existsSync(OsvOfflineDb.rootDirectory)) {
    await fs.mkdir(OsvOfflineDb.rootDirectory);
  }

  const zip = new AdmZip();

  for (const ecosystem of ecosystems) {
    signale.info(`Processing ecosystem ${ecosystem}`);
    const databasePath = path.join(
      OsvOfflineDb.rootDirectory,
      `${ecosystem.toLowerCase()}.nedb`
    );
    await deleteIfExists(databasePath);
    const osv = new OsvDownloader(ecosystem);
    const vulnerabilities = await osv.download();
    signale.info(
      `Downloaded ${vulnerabilities.length} vulnerabilities for ecosystem ${ecosystem}`
    );

    const out = createWriteStream(databasePath, { encoding: 'utf8' });
    // a precomputed index saves clients from scanning the whole database
    const index = new DatabaseIndexBuilder();
    for (const vuln of vulnerabilities) {
      const record: DatabaseRecord = { ...vuln, _id: generateId() };
      const line = JSON.stringify(record);
      index.add(line, record);
      if (!out.write(line + '\n')) {
        await new Promise<void>((resolve) => out.once('drain', resolve));
      }
    }
    out.end();
    await finished(out);

    const indexPath = path.join(
      OsvOfflineDb.rootDirectory,
      getIndexFileName(ecosystem)
    );
    await fs.writeFile(indexPath, index.serialize(), 'utf8');

    zip.addLocalFile(databasePath);
    zip.addLocalFile(indexPath);
  }

  const zipFile = zip.toBuffer();

  if (process.env.GITHUB_TOKEN) {
    signale.info('Uploading databases');
    const gh = new GitHub();
    await gh.uploadDatabase(zipFile);
  } else {
    signale.warn('Skipping upload of databases');
  }
})();
