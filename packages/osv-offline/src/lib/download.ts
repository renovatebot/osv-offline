import fs from 'fs-extra';
import fetch from 'node-fetch';
import { Octokit } from '@octokit/rest';
import got from 'got';
import { Stream } from 'stream';
import { promisify } from 'util';
import { OsvOfflineDb } from '@renovatebot/osv-offline-db';
import path from 'path';
import { DateTime } from 'luxon';
import AdmZip from 'adm-zip';
import { Result, failure, success } from './types';

const pipeline = promisify(Stream.pipeline);

const baseParameters: { owner: string; repo: string } = {
  owner: 'renovatebot',
  repo: 'osv-offline',
};

export async function tryDownloadDb(githubToken?: string): Promise<Result> {
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
  } catch (err) {
    // ignored
  }
  if (
    stats !== undefined &&
    DateTime.utc().diff(DateTime.fromJSDate(stats.mtime)).as('days') < 1
  ) {
    return success();
  }

  const octokitOptions = {
    auth: githubToken ? githubToken : process.env['GITHUB_COM_TOKEN'],
    request: { fetch },
  };

  let latestRelease = null;
  try {
    latestRelease = (
      await new Octokit(octokitOptions).repos.listReleases({
        ...baseParameters,
      })
    ).data[0];
  } catch (err) {
    return failure(err as Error);
  }

  const asset = latestRelease?.assets.find(
    (asset) => asset.name === 'osv-offline.zip'
  );

  // if local database is the same size as remote database, don't download again
  if (asset?.size === stats?.size) {
    return success();
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
      return failure(err as Error);
    }
  }

  return success();
}
