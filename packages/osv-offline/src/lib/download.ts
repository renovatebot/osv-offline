import fs from 'fs-extra';
import got from 'got';
import { pipeline } from 'node:stream/promises';
import { OsvOfflineDb } from '@renovatebot/osv-offline-db';
import path from 'path';
import { DateTime } from 'luxon';
import AdmZip from 'adm-zip';
import { Result, failure, success } from './types.ts';
import debug from 'debug';

const logger = debug('osv-offline:download');

export async function tryDownloadDb(): Promise<Result> {
  await fs.ensureDir(OsvOfflineDb.rootDirectory);

  if (process.env.OSV_OFFLINE_DISABLE_DOWNLOAD?.toLowerCase() === 'true') {
    logger('Skipping database download.');
    return success();
  }

  // if local database exists and is less than a day old, don't do any network requests
  let stats: fs.Stats | undefined;
  try {
    stats = await fs.stat(
      path.join(OsvOfflineDb.rootDirectory, `osv-offline.zip`)
    );
  } catch {
    // ignored
  }
  if (
    stats !== undefined &&
    DateTime.utc().diff(DateTime.fromJSDate(stats.mtime)).as('days') < 1
  ) {
    logger('Skipping download, databases are up-to-date.');
    return success();
  }

  // only download databases if local databases are missing or remote is newer
  // download and extract into a temporary directory first, so a failed attempt leaves the current databases untouched
  const tmpDir = await fs.mkdtemp(
    path.join(OsvOfflineDb.rootDirectory, '.download-')
  );
  try {
    logger('Downloading databases ...');
    const databaseUrl =
      process.env.OSV_OFFLINE_DATABASE_URL ??
      'https://github.com/renovatebot/osv-offline/releases/latest/download/osv-offline.zip';
    const stream = got.stream(databaseUrl);
    const tmpZipPath = path.join(tmpDir, 'osv-offline.zip');
    const writeStream = fs.createWriteStream(tmpZipPath);
    await pipeline(stream, writeStream);
    logger('Downloading databases done.');
    logger('Extracting databases ...');
    const extractDir = path.join(tmpDir, 'extracted');
    const zip = new AdmZip(tmpZipPath);
    zip.extractAllTo(extractDir);
    // renaming replaces existing databases, while readers which already opened them keep reading the old files
    for (const file of await fs.readdir(extractDir)) {
      await fs.rename(
        path.join(extractDir, file),
        path.join(OsvOfflineDb.rootDirectory, file)
      );
    }
    // the zip's modification time marks the databases as up-to-date, so it's moved last
    await fs.rename(
      tmpZipPath,
      path.join(OsvOfflineDb.rootDirectory, 'osv-offline.zip')
    );
    logger('Extracting databases done.');
  } catch (err) {
    return failure(err as Error);
  } finally {
    await fs.remove(tmpDir);
  }

  return success();
}
