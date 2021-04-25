import fs from 'fs-extra';
import { Octokit } from '@octokit/rest';
import got from 'got';
import { Stream } from 'stream';
import { promisify } from 'util';
import { dbPath, dbDirectory, dbFileName } from '@jamiemagee/ghsa-offline-db';

const pipeline = promisify(Stream.pipeline);

const baseParameters: { owner: string; repo: string } = {
  owner: 'JamieMagee',
  repo: 'ghsa-offline',
};

export async function downloadDb() {
  if (!fs.existsSync(dbDirectory)) {
    await fs.mkdir(dbDirectory);
  }

  if (!fs.existsSync(dbPath)) {
    const octokit = new Octokit();

    const latestRelease = (
      await octokit.repos.listReleases({
        ...baseParameters,
      })
    ).data[0];

    const asset = latestRelease.assets.find(
      (asset) => asset.name === dbFileName
    );

    const stream = got.stream(asset!.browser_download_url);
    const writeStream = fs.createWriteStream(dbPath);
    await pipeline(stream, writeStream);
  }
}
