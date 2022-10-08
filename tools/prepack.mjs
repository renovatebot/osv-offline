import path from 'path';
import { fileURLToPath } from 'url';
import { Octokit } from '@octokit/rest';
import fs from 'fs-extra';
import AdmZip from 'adm-zip';
import got from 'got';
import { promisify } from 'util';
import { Stream } from 'stream';

const pipeline = promisify(Stream.pipeline);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const downloadDirectory = path.join(
  __dirname,
  '..',
  'packages',
  'osv-offline',
  'dist',
  'db'
);

await fs.ensureDir(downloadDirectory);

/** @type {{owner: string, repo: string}} */
const baseParameters = {
  owner: 'renovatebot',
  repo: 'osv-offline',
};

const latestRelease = (
  await new Octokit().repos.listReleases({
    ...baseParameters,
  })
).data[0];

const asset = latestRelease.assets.find(
  (asset) => asset.name === 'osv-offline.zip'
);

const stream = got.stream(asset.browser_download_url);
const zipPath = path.join(downloadDirectory, asset.name);
const writeStream = fs.createWriteStream(zipPath);
await pipeline(stream, writeStream);
const zip = new AdmZip(zipPath);
zip.extractAllTo(downloadDirectory);
fs.rmSync(zipPath);
