import fs from 'fs-extra';
import path from 'node:path';
import {
  OsvOfflineDb,
  type SplitIndex,
  ecosystems,
} from '@renovatebot/osv-offline-db';
import { DateTime } from 'luxon';
import { GitHub, getDatabaseTag, getSplitBaseUrl } from './client/github.ts';
import signale from 'signale';
import { OsvDownloader } from './client/osv.ts';
import AdmZip from 'adm-zip';
import { writeDatabase } from './lib/database.ts';
import { readVulnerabilities } from './lib/osv-zip.ts';
import { writeSplitFiles, writeSplitIndex } from './lib/split.ts';

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  if (!fs.existsSync(OsvOfflineDb.rootDirectory)) {
    await fs.mkdir(OsvOfflineDb.rootDirectory);
  }

  const generated = new Date();
  // the release of the run holds the zip and the files of the split format
  const tag = getDatabaseTag(generated);
  // e.g. 20261027120513: the version of the split files
  const version = DateTime.fromJSDate(generated, { zone: 'utc' }).toFormat(
    'yyyyMMddHHmmss'
  );
  const splitDir = path.join(OsvOfflineDb.rootDirectory, 'split');
  const pagesDir =
    process.env.OSV_OFFLINE_PAGES_DIR ??
    path.join(OsvOfflineDb.rootDirectory, 'pages');

  const zip = new AdmZip();
  const splitEcosystems: SplitIndex['ecosystems'] = {};

  const osvZip = path.join(OsvOfflineDb.rootDirectory, 'osv-all.zip');

  for (const ecosystem of ecosystems) {
    signale.info(`Processing ecosystem ${ecosystem}`);
    await new OsvDownloader(ecosystem).download(osvZip);
    signale.info(`Downloaded vulnerabilities for ecosystem ${ecosystem}`);

    const files = await writeDatabase(
      OsvOfflineDb.rootDirectory,
      ecosystem,
      readVulnerabilities(osvZip)
    );
    await fs.remove(osvZip);
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
    getSplitBaseUrl(tag)
  );

  const zipFile = zip.toBuffer();

  if (process.env.GITHUB_TOKEN) {
    signale.info('Uploading databases');
    const gh = new GitHub();
    // the workflow deploys the index to GitHub Pages afterwards, once the files it lists are published
    await gh.uploadDatabase(tag, zipFile, splitDir, splitIndex);
  } else {
    signale.warn('Skipping upload of databases');
  }
})();
