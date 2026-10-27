import { Octokit } from '@octokit/rest';
import { type SplitIndex, parseSplitIndex } from '@renovatebot/osv-offline-db';
import fs from 'fs-extra';
import path from 'node:path';
import signale from 'signale';
import { DateTime } from 'luxon';

/** prefix of the tags of database releases, e.g. `1-2021020819` */
const databaseTagPrefix = '1-';

/** how many database releases to keep, including the new one, as a fallback for a broken database */
const keptDatabaseReleases = 2;

/** tag of the release which holds the files of the split format */
const splitReleaseTag = 'database';

/** how long older files of the split format are kept: a day for proxies caching the index, plus one run */
const splitRetention = { hours: 28 };

/** e.g. `npm-20261027120513.nedb.zst`: the file without version (`npm`, `nedb`) and its version */
const splitFileRegex = /^(?<name>.+)-(?<version>\d{14})\.(?<kind>.+)\.zst$/;

/** the index of the split format currently deployed to GitHub Pages */
const publishedSplitIndexUrl =
  'https://renovatebot.github.io/osv-offline/v2/index.json';

export class GitHub {
  private readonly octokit: Octokit;
  private readonly baseParameters: { owner: string; repo: string } = {
    owner: 'renovatebot',
    repo: 'osv-offline',
  };

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  async uploadDatabase(zipFile: Buffer) {
    const latestCommit = await this.getLatestCommit();
    signale.info(`Latest commit is ${latestCommit}`);
    const tag = await this.createTag(latestCommit);
    signale.info(`Created tag ${tag.data.tag}`);
    // a draft until the database is uploaded, so the latest release always has one
    const release = await this.createRelease(tag.data.tag);
    signale.info(`Created draft release ${release.data.id}`);
    await this.createReleaseAsset(release.data.id, zipFile);
    await this.publishRelease(release.data.id);
    signale.info(`Published release ${release.data.id}`);
    await this.deleteOldReleases();
  }

  /**
   * Uploads the files of the split format listed in `index` from `directory` to the `database` release, then deletes
   * files older than the retention, except the newest version of each file and the files listed by the published index.
   */
  async uploadSplitFiles(directory: string, index: SplitIndex) {
    const release = await this.getSplitRelease();
    const existing = new Set(
      (await this.listReleaseAssets(release.id)).map(({ name }) => name)
    );
    for (const file of getSplitFiles(index).filter(
      (file) => !existing.has(file)
    )) {
      const data = await fs.readFile(path.join(directory, file));
      await this.octokit.repos.uploadReleaseAsset({
        ...this.baseParameters,
        release_id: release.id,
        data: data as unknown as string,
        headers: {
          'content-type': 'application/zstd',
          'content-length': data.length,
        },
        name: file,
      });
      signale.info(`Uploaded ${file}`);
    }
    // when a deployment of GitHub Pages failed, the published index still lists older files
    const published = await getPublishedSplitIndex();
    if (!published) {
      signale.warn('Skipping deletion of old split files');
      return;
    }
    await this.deleteOldSplitFiles(
      release.id,
      new Set(getSplitFiles(published))
    );
  }

  /**
   * Returns the release of the split format, creating it when missing. It's never the latest release, which clients of
   * the zip format download from.
   */
  private async getSplitRelease() {
    try {
      const { data } = await this.octokit.repos.getReleaseByTag({
        ...this.baseParameters,
        tag: splitReleaseTag,
      });
      return data;
    } catch (err) {
      if ((err as { status?: number }).status !== 404) {
        throw err;
      }
      const { data } = await this.octokit.repos.createRelease({
        ...this.baseParameters,
        tag_name: splitReleaseTag,
        name: 'Database',
        body: 'Databases in the split format, listed by https://renovatebot.github.io/osv-offline/v2/index.json',
        make_latest: 'false',
      });
      signale.info(`Created release ${splitReleaseTag}`);
      return data;
    }
  }

  private async listReleaseAssets(releaseId: number) {
    return await this.octokit.paginate(this.octokit.repos.listReleaseAssets, {
      ...this.baseParameters,
      release_id: releaseId,
      per_page: 100,
    });
  }

  private async deleteOldSplitFiles(releaseId: number, kept: Set<string>) {
    const cutoff = DateTime.utc().minus(splitRetention);
    const versions = (await this.listReleaseAssets(releaseId))
      .map((asset) => ({ asset, match: splitFileRegex.exec(asset.name) }))
      .filter(({ match }) => match?.groups)
      .map(({ asset, match }) => ({
        asset,
        file: `${match!.groups!.name}.${match!.groups!.kind}`,
        version: match!.groups!.version,
      }))
      .sort((a, b) => b.version.localeCompare(a.version));
    const newest = new Map<string, string>();
    for (const { file, version } of versions) {
      if (!newest.has(file)) {
        newest.set(file, version);
      }
    }
    const old = versions.filter(
      ({ asset, file, version }) =>
        newest.get(file) !== version &&
        !kept.has(asset.name) &&
        DateTime.fromFormat(version, 'yyyyMMddHHmmss', { zone: 'utc' }) < cutoff
    );
    for (const { asset } of old) {
      await this.octokit.repos.deleteReleaseAsset({
        ...this.baseParameters,
        asset_id: asset.id,
      });
      signale.info(`Deleted ${asset.name}`);
    }
  }

  /**
   * Deletes the database releases and their tags, except the newest ones. Other releases, e.g. of the packages, are kept.
   */
  private async deleteOldReleases() {
    signale.info('Deleting old database releases');
    const releases = await this.octokit.paginate(
      this.octokit.repos.listReleases,
      { ...this.baseParameters, per_page: 100 }
    );
    const oldReleases = releases
      .filter(
        (release) =>
          release.tag_name.startsWith(databaseTagPrefix) && !release.draft
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(keptDatabaseReleases);
    signale.info(`Found ${oldReleases.length} old database releases`);
    for (const release of oldReleases) {
      // deleting a release deletes its assets, but not its tag
      await this.octokit.repos.deleteRelease({
        ...this.baseParameters,
        release_id: release.id,
      });
      await this.octokit.git
        .deleteRef({ ...this.baseParameters, ref: `tags/${release.tag_name}` })
        .catch(() => signale.warn(`Tag ${release.tag_name} not found`));
    }
  }

  private async getLatestCommit() {
    const branch = await this.octokit.repos.getBranch({
      ...this.baseParameters,
      branch: 'main',
    });
    return branch.data.commit.sha;
  }

  private async createTag(sha: string) {
    // 1-2021020819
    const name = `${databaseTagPrefix}${DateTime.utc().toFormat('yyyyMMddHH')}`;
    return await this.octokit.git.createTag({
      ...this.baseParameters,
      tag: name,
      message: name,
      object: sha,
      type: 'commit',
    });
  }

  private async createRelease(tag: string) {
    return await this.octokit.repos.createRelease({
      ...this.baseParameters,
      tag_name: tag,
      draft: true,
    });
  }

  private async publishRelease(releaseId: number) {
    // clients download the database from the latest release
    await this.octokit.repos.updateRelease({
      ...this.baseParameters,
      release_id: releaseId,
      draft: false,
      make_latest: 'true',
    });
  }

  private async createReleaseAsset(releaseId: number, zipFile: Buffer) {
    await this.octokit.repos.uploadReleaseAsset({
      ...this.baseParameters,
      release_id: releaseId,
      data: zipFile as unknown as string,
      headers: {
        'content-type': 'application/octet-stream',
        'content-length': zipFile.length,
      },
      name: 'osv-offline.zip',
    });
  }
}

function getSplitFiles(index: SplitIndex): string[] {
  return Object.values(index.ecosystems).flatMap(({ database, index }) => [
    database.file,
    index.file,
  ]);
}

/**
 * Returns the index deployed to GitHub Pages, or `null` when it can't be fetched.
 */
async function getPublishedSplitIndex(): Promise<SplitIndex | null> {
  try {
    const response = await fetch(publishedSplitIndexUrl, {
      headers: { 'cache-control': 'no-cache' },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return parseSplitIndex(await response.text());
  } catch (err) {
    signale.warn(`Failed to fetch ${publishedSplitIndexUrl}: ${String(err)}`);
    return null;
  }
}
