import fs from 'fs-extra';
import { Octokit } from '@octokit/rest';
import { DateTime } from 'luxon';
import signale from 'signale';

export class GitHub {
  private readonly octokit: Octokit;
  private readonly baseParameters: { owner: string; repo: string } = {
    owner: 'JamieMagee',
    repo: 'ghsa-offline',
  };

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  async uploadDatabase(path: string) {
    await this.deleteOldReleases();
    const latestCommit = await this.getLatestCommit();
    signale.info(`Latest commit is ${latestCommit}`);
    const tag = await this.createTag(latestCommit);
    signale.info(`Created tag ${tag.data.tag}`);
    const release = await this.createRelease(tag.data.tag);
    signale.info(`Created release ${release.data.id}`);
    await this.createReleaseAsset(release.data.id, path);
  }

  private async deleteOldReleases() {
    signale.info('Deleting old releases');
    const releases = await this.octokit.repos.listReleases({
      ...this.baseParameters,
    });
    signale.info(`Found ${releases.data.length} releases`);
    await Promise.all(
      releases.data.map(async (release) => {
        await Promise.all(
          release.assets.map(async (asset) => {
            await this.octokit.repos.deleteReleaseAsset({
              ...this.baseParameters,
              asset_id: asset.id,
            });
          })
        );
        await this.octokit.repos.deleteRelease({
          ...this.baseParameters,
          release_id: release.id,
        });
      })
    );
    const tags = (
      await this.octokit.repos.listTags({ ...this.baseParameters })
    ).data.filter((tag) => tag.name.startsWith('1-'));
    await Promise.all(
      tags.map(async (tag) => {
        await this.octokit.git.deleteRef({
          ...this.baseParameters,
          ref: `tags/${tag.name}`,
        });
      })
    );
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
    const name = `1-${DateTime.utc().toFormat('yyyyMMddHH')}`;
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
    });
  }

  private async createReleaseAsset(releaseId: number, path: string) {
    await this.octokit.repos.uploadReleaseAsset({
      ...this.baseParameters,
      release_id: releaseId,
      data: (await fs.readFile(path)) as unknown as string,
      headers: {
        'content-type': 'application/octet-stream',
        'content-length': (await fs.stat(path)).size,
      },
      name: 'ghsa.sqlite',
    });
  }
}
