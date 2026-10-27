import { Octokit } from '@octokit/rest';
import signale from 'signale';
import { DateTime } from 'luxon';

/** prefix of the tags of database releases, e.g. `1-2021020819` */
const databaseTagPrefix = '1-';

/** how many database releases to keep, including the new one, as a fallback for a broken database */
const keptDatabaseReleases = 2;

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
