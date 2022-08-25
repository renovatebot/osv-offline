import fs from 'fs-extra';
import { Osv, OsvOfflineDb, ecosystems } from '@renovatebot/osv-offline-db';
import { GitHub } from './client/github';
import signale from 'signale';
import Datastore from '@seald-io/nedb';
import { OsvDownloader } from './client/osv';
import path from 'path';
import AdmZip from 'adm-zip';

async function deleteIfExists(path: string): Promise<void> {
  try {
    await fs.remove(path);
    signale.info(`Deleted existing database at ${path}`);
  } catch (e) {
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
    const db = new Datastore<Osv.Vulnerability>({
      filename: databasePath,
    });
    await db.loadDatabaseAsync();
    const osv = new OsvDownloader(ecosystem);
    const vulnerabilities = await osv.download();
    signale.info(
      `Downloaded ${vulnerabilities.length} vulnerabilities for ecosystem ${ecosystem}`
    );
    await db.insertAsync(vulnerabilities);
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
