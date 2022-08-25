import fs from 'fs-extra';
import { Octokit } from '@octokit/rest';
import got from 'got';
import { Stream } from 'stream';
import { promisify } from 'util';
import { OsvOfflineDb } from '@renovatebot/osv-offline-db';
import path from 'path';
import { DateTime } from 'luxon';
import AdmZip from 'adm-zip';

const pipeline = promisify(Stream.pipeline);

const baseParameters: { owner: string; repo: string } = {
  owner: 'renovatebot',
  repo: 'osv-offline',
};

export async function tryDownloadDb(): Promise<boolean> {
  await fs.ensureDir(OsvOfflineDb.rootDirectory);

  // if local database exists and is less than a day old, don't do any network requests
  let stats: fs.Stats | undefined;
  try {
    stats = await fs.stat(
      path.join(OsvOfflineDb.rootDirectory, `osv-offline.zip`)
    );
  } catch (err) {
    // ignored
  }
  if (
    stats !== undefined &&
    DateTime.utc().diff(DateTime.fromJSDate(stats.mtime)).as('days') < 1
  ) {
    return true;
  }

  const latestRelease = (
    await new Octokit().repos.listReleases({
      ...baseParameters,
    })
  ).data[0];

  const asset = latestRelease.assets.find(
    (asset) => asset.name === 'osv-offline.zip'
  );

  // if local database is the same size as remote database, don't download again
  if (asset?.size === stats?.size) {
    return true;
  }

  if (asset !== undefined) {
    // only download databases if local databases are missing or remote is newer
    try {
      const stream = got.stream(asset.browser_download_url);
      const zipPath = path.join(OsvOfflineDb.rootDirectory, asset.name);
      const writeStream = fs.createWriteStream(zipPath);
      await pipeline(stream, writeStream);
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(OsvOfflineDb.rootDirectory);
    } catch (err) {
      return false;
    }
  }

  return true;
}
