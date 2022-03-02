import fs from 'fs-extra';
import { Octokit } from '@octokit/rest';
import got from 'got';
import { Stream } from 'stream';
import { promisify } from 'util';
import { OsvOfflineDb, ecosystems } from '@jamiemagee/osv-offline-db';
import path from 'path';

const pipeline = promisify(Stream.pipeline);

const baseParameters: { owner: string; repo: string } = {
  owner: 'JamieMagee',
  repo: 'osv-offline',
};

export async function tryDownloadDb(): Promise<boolean> {
  if (!fs.existsSync(OsvOfflineDb.rootDirectory)) {
    await fs.mkdir(OsvOfflineDb.rootDirectory);
  }

  let success = true;

  const octokit = new Octokit();

  const latestRelease = (
    await octokit.repos.listReleases({
      ...baseParameters,
    })
  ).data[0];

  const databaseAssets = latestRelease.assets.filter((asset) =>
    asset.name.endsWith('.nedb')
  );

  for (const asset of databaseAssets) {
    try {
      const stream = got.stream(asset.browser_download_url);
      const databasePath = path.join(OsvOfflineDb.rootDirectory, asset.name);
      const writeStream = fs.createWriteStream(databasePath);
      await pipeline(stream, writeStream);
    } catch (err) {
      success = false;
    }
  }

  return success;
}
