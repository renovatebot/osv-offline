import { Octokit } from '@octokit/rest';
import { type SplitIndex, parseSplitIndex } from '@renovatebot/osv-offline-db';
import fs from 'fs-extra';
import path from 'node:path';
import signale from 'signale';
import { DateTime } from 'luxon';

/** prefix of the tags of database releases, e.g. `1-2021020819` */
const databaseTagPrefix = '1-';

/** how many database releases to keep at least, including the new one, as a fallback for a broken database */
const keptDatabaseReleases = 2;

/** how long older database releases are kept: a day for proxies caching the index, plus one run */
const databaseRetention = { hours: 28 };

/** tag of the release which held the files of the split format before they moved to the database releases */
const legacySplitReleaseTag = 'database';

/** where the assets of a release are downloaded from, followed by its tag */
const releaseDownloadUrl =
  'https://github.com/renovatebot/osv-offline/releases/download/';

/** the index of the split format currently deployed to GitHub Pages */
const publishedSplitIndexUrl =
  'https://renovatebot.github.io/osv-offline/v2/index.json';

/**
 * Returns the tag of the database release of a run, e.g. `1-2021020819`.
 */
export function getDatabaseTag(date: Date): string {
  return `${databaseTagPrefix}${DateTime.fromJSDate(date, { zone: 'utc' }).toFormat('yyyyMMddHH')}`;
}

/**
 * Returns the URL the files of the split format are downloaded from: the assets of the database release `tag`.
 */
export function getSplitBaseUrl(tag: string): string {
  return `${releaseDownloadUrl}${tag}/`;
}

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

  /**
   * Publishes the database release `tag` with the zip and the files of the split format listed in `index` from
   * `splitDir`, then deletes old database releases. The release is a draft until all files are uploaded, so the latest
   * release always has them, and it works with immutable releases.
   */
  async uploadDatabase(
    tag: string,
    zipFile: Buffer,
    splitDir: string,
    index: SplitIndex
  ) {
    const latestCommit = await this.getLatestCommit();
    signale.info(`Latest commit is ${latestCommit}`);
    await this.createTag(tag, latestCommit);
    signale.info(`Created tag ${tag}`);
    const release = await this.createRelease(tag);
    signale.info(`Created draft release ${release.data.id}`);
    await this.uploadReleaseAsset(
      release.data.id,
      'osv-offline.zip',
      zipFile,
      'application/octet-stream'
    );
    for (const file of getSplitFiles(index)) {
      await this.uploadReleaseAsset(
        release.data.id,
        file,
        await fs.readFile(path.join(splitDir, file)),
        'application/zstd'
      );
      signale.info(`Uploaded ${file}`);
    }
    await this.publishRelease(release.data.id);
    signale.info(`Published release ${release.data.id}`);
    await this.deleteOldReleases();
  }

  /**
   * Deletes database releases and their tags which are older than the retention, except the newest ones and the release
   * of the published index. Deletes the former release of the split format once the published index doesn't use it and
   * its files are older than the retention.
   * Other releases, e.g. of the packages, are kept.
   */
  private async deleteOldReleases() {
    // when a deployment of GitHub Pages failed, the published index still points to an older release
    const published = await getPublishedSplitIndex();
    if (!published) {
      signale.warn('Skipping deletion of old database releases');
      return;
    }
    const publishedTag = getReleaseTag(published.baseUrl);
    const cutoff = DateTime.utc().minus(databaseRetention);
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
      .slice(keptDatabaseReleases)
      .filter(
        (release) =>
          release.tag_name !== publishedTag &&
          DateTime.fromISO(release.created_at) < cutoff
      );
    // like its files before, kept for the retention after the last upload, as caching proxies may serve an older index
    oldReleases.push(
      ...releases.filter(
        (release) =>
          release.tag_name === legacySplitReleaseTag &&
          publishedTag !== legacySplitReleaseTag &&
          release.assets.every(
            (asset) => DateTime.fromISO(asset.created_at) < cutoff
          )
      )
    );
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
      signale.info(`Deleted release ${release.tag_name}`);
    }
  }

  private async getLatestCommit() {
    const branch = await this.octokit.repos.getBranch({
      ...this.baseParameters,
      branch: 'main',
    });
    return branch.data.commit.sha;
  }

  private async createTag(tag: string, sha: string) {
    return await this.octokit.git.createTag({
      ...this.baseParameters,
      tag,
      message: tag,
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
    // clients of the zip format download the database from the latest release
    await this.octokit.repos.updateRelease({
      ...this.baseParameters,
      release_id: releaseId,
      draft: false,
      make_latest: 'true',
    });
  }

  private async uploadReleaseAsset(
    releaseId: number,
    name: string,
    data: Buffer,
    contentType: string
  ) {
    await this.octokit.repos.uploadReleaseAsset({
      ...this.baseParameters,
      release_id: releaseId,
      data: data as unknown as string,
      headers: {
        'content-type': contentType,
        'content-length': data.length,
      },
      name,
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
 * Returns the tag of the release a `baseUrl` of the split format points to, if any.
 */
function getReleaseTag(baseUrl: string | undefined): string | undefined {
  return baseUrl?.startsWith(releaseDownloadUrl)
    ? baseUrl.slice(releaseDownloadUrl.length).replace(/\/$/, '')
    : undefined;
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
