import fs from 'fs-extra';
import { createWriteStream } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { finished } from 'node:stream/promises';
import { OsvOfflineDb, ecosystems } from '@renovatebot/osv-offline-db';
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
    for (const vuln of vulnerabilities) {
      const line = JSON.stringify({ ...vuln, _id: generateId() });
      if (!out.write(line + '\n')) {
        await new Promise<void>((resolve) => out.once('drain', resolve));
      }
    }
    out.end();
    await finished(out);

    zip.addLocalFile(databasePath);
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
