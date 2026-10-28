import fs from 'fs-extra';
import path from 'node:path';
import {
  OsvOfflineDb,
  type SplitIndex,
  ecosystems,
} from '@renovatebot/osv-offline-db';
import { DateTime } from 'luxon';
import { GitHub } from './client/github.ts';
import signale from 'signale';
import { OsvDownloader } from './client/osv.ts';
import AdmZip from 'adm-zip';
import { writeDatabase } from './lib/database.ts';
import { writeSplitFiles, writeSplitIndex } from './lib/split.ts';

/** where the files of the split format are downloaded from */
const splitBaseUrl =
  'https://github.com/renovatebot/osv-offline/releases/download/database/';

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  if (!fs.existsSync(OsvOfflineDb.rootDirectory)) {
    await fs.mkdir(OsvOfflineDb.rootDirectory);
  }

  const generated = new Date();
  // e.g. 20261027120513: unique per run, as files with the same name aren't uploaded again
  const version = DateTime.fromJSDate(generated, { zone: 'utc' }).toFormat(
    'yyyyMMddHHmmss'
  );
  const splitDir = path.join(OsvOfflineDb.rootDirectory, 'split');
  const pagesDir =
    process.env.OSV_OFFLINE_PAGES_DIR ??
    path.join(OsvOfflineDb.rootDirectory, 'pages');

  const zip = new AdmZip();
  const splitEcosystems: SplitIndex['ecosystems'] = {};

  for (const ecosystem of ecosystems) {
    signale.info(`Processing ecosystem ${ecosystem}`);
    const osv = new OsvDownloader(ecosystem);
    const vulnerabilities = await osv.download();
    signale.info(
      `Downloaded ${vulnerabilities.length} vulnerabilities for ecosystem ${ecosystem}`
    );

    const files = await writeDatabase(
      OsvOfflineDb.rootDirectory,
      ecosystem,
      vulnerabilities
    );
    for (const file of files) {
      zip.addLocalFile(file);
    }
    splitEcosystems[ecosystem] = await writeSplitFiles(
      splitDir,
      ecosystem,
      version,
      files
    );
  }

  const splitIndex = await writeSplitIndex(
    path.join(pagesDir, 'v2', 'index.json'),
    splitEcosystems,
    generated,
    splitBaseUrl
  );

  const zipFile = zip.toBuffer();

  if (process.env.GITHUB_TOKEN) {
    signale.info('Uploading databases');
    const gh = new GitHub();
    await gh.uploadDatabase(zipFile);
    // the workflow deploys the index to GitHub Pages afterwards, once the files it lists are uploaded
    await gh.uploadSplitFiles(splitDir, splitIndex);
  } else {
    signale.warn('Skipping upload of databases');
  }
})();
