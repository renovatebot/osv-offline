import fs from 'fs-extra';
import { OsvOfflineDb, ecosystems } from '@renovatebot/osv-offline-db';
import { GitHub } from './client/github.ts';
import signale from 'signale';
import { OsvDownloader } from './client/osv.ts';
import AdmZip from 'adm-zip';
import { writeDatabase } from './lib/database.ts';

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  if (!fs.existsSync(OsvOfflineDb.rootDirectory)) {
    await fs.mkdir(OsvOfflineDb.rootDirectory);
  }

  const zip = new AdmZip();

  for (const ecosystem of ecosystems) {
    signale.info(`Processing ecosystem ${ecosystem}`);
    const osv = new OsvDownloader(ecosystem);
    const vulnerabilities = await osv.download();
    signale.info(
      `Downloaded ${vulnerabilities.length} vulnerabilities for ecosystem ${ecosystem}`
    );

    for (const file of await writeDatabase(
      OsvOfflineDb.rootDirectory,
      ecosystem,
      vulnerabilities
    )) {
      zip.addLocalFile(file);
    }
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
