import { tmpdir } from 'os';
import path from 'path';
import fs from 'fs-extra';
import simpleGit, { SimpleGit } from 'simple-git';
import { PathsOutput, fdir } from 'fdir';
import type { GithubSecurityAdvisory, Version } from './types';
import { Package, Vulnerability } from '@jamiemagee/ghsa-offline-db';

export class VulnList {
  private readonly repoPath = path.join(tmpdir(), 'vuln-list');

  async clone(): Promise<void> {
    let git: SimpleGit;
    if (fs.existsSync(this.repoPath)) {
      git = simpleGit(this.repoPath);
      await git.pull();
    } else {
      await fs.mkdir(this.repoPath);
      git = simpleGit(this.repoPath);
      await git.clone(
        'https://github.com/aquasecurity/vuln-list',
        this.repoPath,
        {
          '--depth': 1,
          '--no-checkout': null,
        }
      );
      await git.raw(['sparse-checkout', 'init', '--cone']);
      await git.raw(['sparse-checkout', 'set', 'ghsa']);
      await git.checkout('main');
    }
  }

  async crawl(): Promise<PathsOutput> {
    return (await new fdir()
      .withFullPaths()
      .filter((path) => path.includes('/ghsa/'))
      .crawl(path.join(this.repoPath))
      .withPromise()) as PathsOutput;
  }
}

export function parseVersions(version: Version): {
  patchedVersion: string;
  applicableVersions: string;
} {
  if (version.FirstPatchedVersion.Identifier.startsWith('< ')) {
    return {
      patchedVersion: version.FirstPatchedVersion.Identifier.substring(2),
      applicableVersions: `${
        (version.VulnerableVersionRange, version.FirstPatchedVersion.Identifier)
      }`,
    };
  }
  return {
    patchedVersion: version.FirstPatchedVersion.Identifier,
    applicableVersions: version.VulnerableVersionRange,
  };
}

export function convertToPackage(
  ghsa: GithubSecurityAdvisory
): Pick<Package, 'ecosystem' | 'packageName'> {
  return {
    ecosystem: ghsa.Package.Ecosystem,
    packageName: ghsa.Package.Name,
  };
}

export function convertToVulnerability(
  ghsa: GithubSecurityAdvisory
): Pick<
  Vulnerability,
  | 'ecosystem'
  | 'packageName'
  | 'title'
  | 'description'
  | 'patchedVersions'
  | 'vulnerableVersions'
  | 'references'
  | 'identifiers'
  | 'severity'
> {
  const versions = ghsa.Versions.map((version) => parseVersions(version));
  return {
    ecosystem: ghsa.Package.Ecosystem,
    packageName: ghsa.Package.Name,
    title: ghsa.Advisory.Summary,
    description: ghsa.Advisory.Description,
    patchedVersions: versions.map((tuple) => tuple.patchedVersion),
    vulnerableVersions: versions.map((tuple) => tuple.applicableVersions),
    references: ghsa.Advisory.References.map((reference) => reference.Url),
    identifiers: ghsa.Advisory.Identifiers.map(
      (identifier) => identifier.Value
    ),
    severity: ghsa.Severity,
  };
}
