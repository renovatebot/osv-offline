import fs from 'fs-extra';
import got from 'got';
import { pipeline } from 'node:stream/promises';
import { OsvOfflineDb } from '@renovatebot/osv-offline-db';
import path from 'path';
import { DateTime } from 'luxon';
import AdmZip from 'adm-zip';
import { Result, failure, success } from './types';

export async function tryDownloadDb(): Promise<Result> {
  await fs.ensureDir(OsvOfflineDb.rootDirectory);

  if (process.env['OSV_OFFLINE_DISABLE_DOWNLOAD']?.toLowerCase() === 'true') {
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
    return success();
  }

  // only download databases if local databases are missing or remote is newer
  try {
    const stream = got.stream(
      'https://github.com/renovatebot/osv-offline/releases/latest/download/osv-offline.zip'
    );
    const zipPath = path.join(OsvOfflineDb.rootDirectory, 'osv-offline.zip');
    const writeStream = fs.createWriteStream(zipPath);
    await pipeline(stream, writeStream);
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(OsvOfflineDb.rootDirectory);
  } catch (err) {
    return failure(err as Error);
  }

  return success();
}
