import fs from 'fs-extra';
import got from 'got';
import { pipeline } from 'node:stream/promises';
import { OsvOfflineDb } from '@renovatebot/osv-offline-db';
import path from 'path';
import { DateTime } from 'luxon';
import ms from 'ms';
import { Result, failure, success } from './types.ts';
import { extractZip } from './unzip.ts';
import debug from 'debug';

const logger = debug('osv-offline:download');

const defaultMaxAge = '1d';

/**
 * Returns how many milliseconds old the local databases may be before they are downloaded again: `OSV_OFFLINE_MAX_AGE` (e.g. `4h`), or one day.
 */
export function getMaxAge(): number {
  const value = process.env.OSV_OFFLINE_MAX_AGE;
  if (!value) {
    return ms(defaultMaxAge);
  }
  // returns `undefined` for an invalid value, despite the type
  const maxAge: number | undefined = ms(value as ms.StringValue);
  if (maxAge === undefined) {
    logger(`Invalid OSV_OFFLINE_MAX_AGE '${value}', using ${defaultMaxAge}.`);
    return ms(defaultMaxAge);
  }
  return maxAge;
}

export async function tryDownloadDb(): Promise<Result> {
  await fs.ensureDir(OsvOfflineDb.rootDirectory);

  if (process.env.OSV_OFFLINE_DISABLE_DOWNLOAD?.toLowerCase() === 'true') {
    logger('Skipping database download.');
    return success();
  }

  // if local database exists and is younger than the maximum age, don't do any network requests
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
    DateTime.utc().diff(DateTime.fromJSDate(stats.mtime)).toMillis() <
      getMaxAge()
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
    await fs.ensureDir(extractDir);
    const files = await extractZip(tmpZipPath, extractDir);
    // renaming replaces existing databases, while readers which already opened them keep reading the old files
    for (const file of files) {
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
