import * as fs from 'fs/promises';
import { Octokit } from '@octokit/rest';
import { DateTime } from 'luxon';

export class GitHub {
  private readonly octoKit: Octokit;
  private readonly baseParameters: { owner: string; repo: string } = {
    owner: 'JamieMagee',
    repo: 'ghsa-offline',
  };

  constructor() {
    this.octoKit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  async uploadDatabase(path: string) {
    await this.deleteOldReleases();
    const latestCommit = await this.getLatestCommit();
    const tag = await this.createTag(latestCommit);
    const release = await this.createRelease(tag.data.tag);
    await this.createReleaseAsset(release.data.id, path);
  }

  private async deleteOldReleases() {
    const releases = await this.octoKit.repos.listReleases({
      ...this.baseParameters,
    });
    await Promise.all(
      releases.data.map(async (release) => {
        await this.octoKit.repos.deleteRelease({
          ...this.baseParameters,
          release_id: release.id,
        });
      })
    );
    const tags = await this.octoKit.repos.listTags({ ...this.baseParameters });
    await Promise.all(
      tags.data.map(async (tag) => {
        await this.octoKit.git.deleteRef({
          ...this.baseParameters,
          ref: `tags/${tag.name}`,
        });
      })
    );
  }

  private async getLatestCommit() {
    const branch = await this.octoKit.repos.getBranch({
      ...this.baseParameters,
      branch: 'main',
    });
    return branch.data.commit.sha;
  }

  private async createTag(sha: string) {
    // 1-2021020819
    const name = `1-${DateTime.utc().toFormat('yyyyMMddHH')}`;
    return await this.octoKit.git.createTag({
      ...this.baseParameters,
      tag: name,
      message: name,
      object: sha,
      type: 'commit',
    });
  }

  private async createRelease(tag: string) {
    return await this.octoKit.repos.createRelease({
      ...this.baseParameters,
      tag_name: tag,
    });
  }

  private async createReleaseAsset(releaseId: number, path: string) {
    await this.octoKit.repos.uploadReleaseAsset({
      ...this.baseParameters,
      release_id: releaseId,
      data: ((await fs.readFile(path)) as unknown) as string,
      headers: {
        'content-type': 'application/octet-stream',
        'content-length': (await fs.stat(path)).size,
      },
      name: 'ghsa.sqlite',
    });
  }
}
