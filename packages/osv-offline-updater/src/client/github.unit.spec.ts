import os from 'node:os';
import path from 'node:path';
import type { SplitIndex } from '@renovatebot/osv-offline-db';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GitHub, getDatabaseTag, getSplitBaseUrl } from './github.ts';

const octokit = vi.hoisted(() => ({
  paginate: vi.fn(),
  git: {
    createTag: vi.fn(),
    deleteRef: vi.fn(),
  },
  repos: {
    getBranch: vi.fn(),
    listReleases: vi.fn(),
    createRelease: vi.fn(),
    updateRelease: vi.fn(),
    deleteRelease: vi.fn(),
    uploadReleaseAsset: vi.fn(),
  },
}));

vi.mock('@octokit/rest', () => ({
  Octokit: class {
    constructor() {
      return octokit;
    }
  },
}));

vi.mock('signale', () => ({
  default: { info: vi.fn(), warn: vi.fn() },
}));

function release(
  id: number,
  tag: string,
  createdAt: string,
  draft = false,
  assetsCreatedAt: string[] = [],
) {
  return {
    id,
    tag_name: tag,
    created_at: createdAt,
    draft,
    assets: assetsCreatedAt.map((created_at) => ({ created_at })),
  };
}

function file(name: string) {
  return {
    file: name,
    sha256: 'a'.repeat(64),
    size: 3,
    uncompressedSize: 3,
  };
}

function splitIndex(tag: string): SplitIndex {
  return {
    schema: 2,
    generated: '2026-10-27T12:00:00Z',
    baseUrl: getSplitBaseUrl(tag),
    ecosystems: {
      npm: {
        database: file('npm-20261027120000.nedb.zst'),
        index: file('npm-20261027120000.idx.json.zst'),
      },
    },
  };
}

describe('packages/osv-offline-updater/src/client/github.unit', () => {
  it('names the database release of a run by its time to the second', () => {
    expect(getDatabaseTag(new Date('2026-10-27T12:34:56Z'))).toBe('1-20261027123456');
  });

  it('downloads the split files from the assets of a release', () => {
    expect(getSplitBaseUrl('1-20261027123456')).toBe(
      'https://github.com/renovatebot/osv-offline/releases/download/1-20261027123456/',
    );
  });

  describe('uploadDatabase', () => {
    const calls: string[] = [];
    const index = splitIndex('1-2026102712');
    const fetch = vi.fn();
    let directory: string;

    function upload() {
      return new GitHub().uploadDatabase('1-2026102712', Buffer.from('zip'), directory, index);
    }

    beforeEach(async () => {
      vi.resetAllMocks();
      vi.useFakeTimers({ now: new Date('2026-10-27T12:00:00Z') });
      vi.stubGlobal('fetch', fetch);
      calls.length = 0;
      fetch.mockResolvedValue(new Response(JSON.stringify(splitIndex('1-2026102708'))));
      octokit.repos.getBranch.mockResolvedValue({
        data: { commit: { sha: 'abc' } },
      });
      octokit.git.createTag.mockResolvedValue({ data: {} });
      octokit.repos.createRelease.mockImplementation(() => {
        calls.push('create');
        return Promise.resolve({ data: { id: 10 } });
      });
      octokit.repos.uploadReleaseAsset.mockImplementation(({ name }: { name: string }) => {
        calls.push(`upload ${name}`);
        return Promise.resolve();
      });
      octokit.repos.updateRelease.mockImplementation(() => {
        calls.push('publish');
        return Promise.resolve();
      });
      octokit.repos.deleteRelease.mockImplementation(({ release_id }: { release_id: number }) => {
        calls.push(`delete ${release_id}`);
        return Promise.resolve();
      });
      octokit.git.deleteRef.mockResolvedValue(undefined);
      octokit.paginate.mockResolvedValue([]);
      directory = await fs.mkdtemp(path.join(os.tmpdir(), 'osv-offline-gh-'));
      await fs.writeFile(path.join(directory, 'npm-20261027120000.nedb.zst'), 'db');
      await fs.writeFile(path.join(directory, 'npm-20261027120000.idx.json.zst'), 'idx');
    });

    afterEach(async () => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
      await fs.remove(directory);
    });

    it('publishes the release as latest only after uploading all files', async () => {
      await upload();

      expect(octokit.git.createTag).toHaveBeenCalledWith(
        expect.objectContaining({ tag: '1-2026102712', object: 'abc' }),
      );
      expect(octokit.repos.createRelease).toHaveBeenCalledWith(
        expect.objectContaining({ tag_name: '1-2026102712', draft: true }),
      );
      expect(octokit.repos.uploadReleaseAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          release_id: 10,
          name: 'npm-20261027120000.idx.json.zst',
          headers: {
            'content-type': 'application/zstd',
            'content-length': 3,
          },
        }),
      );
      expect(octokit.repos.updateRelease).toHaveBeenCalledWith(
        expect.objectContaining({
          release_id: 10,
          draft: false,
          make_latest: 'true',
        }),
      );
      expect(calls).toEqual([
        'create',
        'upload osv-offline.zip',
        'upload npm-20261027120000.nedb.zst',
        'upload npm-20261027120000.idx.json.zst',
        'publish',
      ]);
    });

    it('deletes database releases older than the retention and their tags, after publishing', async () => {
      octokit.paginate.mockResolvedValue([
        release(10, '1-2026102712', '2026-10-27T12:00:00Z'),
        release(9, '4.1.0', '2026-10-27T11:09:00Z'),
        release(8, '1-2026102708', '2026-10-27T08:00:00Z'),
        // exactly 28 hours old
        release(7, '1-2026102608', '2026-10-26T08:00:00Z'),
        // older than 28 hours
        release(6, '1-2026102604', '2026-10-26T04:00:00Z'),
        release(5, '1-2026102600', '2026-10-26T00:00:00Z', true),
        release(4, '1-2026102520', '2026-10-25T20:00:00Z'),
      ]);

      await upload();

      expect(calls.slice(-2)).toEqual(['delete 6', 'delete 4']);
      expect(octokit.git.deleteRef.mock.calls).toEqual([
        [expect.objectContaining({ ref: 'tags/1-2026102604' })],
        [expect.objectContaining({ ref: 'tags/1-2026102520' })],
      ]);
    });

    it('keeps the newest database releases and the one of the published index', async () => {
      fetch.mockResolvedValue(new Response(JSON.stringify(splitIndex('1-2026102500'))));
      octokit.paginate.mockResolvedValue([
        release(10, '1-2026102712', '2026-10-27T12:00:00Z'),
        // older than the retention, but one of the two newest
        release(9, '1-2026102504', '2026-10-25T04:00:00Z'),
        release(8, '1-2026102500', '2026-10-25T00:00:00Z'),
        release(7, '1-2026102420', '2026-10-24T20:00:00Z'),
      ]);

      await upload();

      expect(octokit.repos.deleteRelease).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ release_id: 7 }),
      );
    });

    it('deletes the former split release once unused and its files are older than the retention', async () => {
      octokit.paginate.mockResolvedValue([
        release(10, '1-2026102712', '2026-10-27T12:00:00Z'),
        release(3, 'database', '2026-10-20T00:00:00Z', false, [
          '2026-10-26T04:00:00Z',
          '2026-10-26T07:59:59Z',
        ]),
      ]);

      await upload();

      expect(octokit.repos.deleteRelease).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ release_id: 3 }),
      );
      expect(octokit.git.deleteRef).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ ref: 'tags/database' }),
      );
    });

    it('keeps the former split release for the retention after its last upload', async () => {
      octokit.paginate.mockResolvedValue([
        release(10, '1-2026102712', '2026-10-27T12:00:00Z'),
        release(3, 'database', '2026-10-20T00:00:00Z', false, [
          '2026-10-26T04:00:00Z',
          // exactly 28 hours old
          '2026-10-26T08:00:00Z',
        ]),
      ]);

      await upload();

      expect(octokit.repos.deleteRelease).not.toHaveBeenCalled();
    });

    it('keeps no release for a published index without a release URL', async () => {
      fetch.mockResolvedValue(
        new Response(JSON.stringify({ ...splitIndex('1-2026102500'), baseUrl: undefined })),
      );
      octokit.paginate.mockResolvedValue([
        release(10, '1-2026102712', '2026-10-27T12:00:00Z'),
        release(9, '1-2026102504', '2026-10-25T04:00:00Z'),
        release(8, '1-2026102500', '2026-10-25T00:00:00Z'),
      ]);

      await upload();

      expect(octokit.repos.deleteRelease).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ release_id: 8 }),
      );
    });

    it('keeps the former split release while the published index uses it', async () => {
      fetch.mockResolvedValue(new Response(JSON.stringify(splitIndex('database'))));
      octokit.paginate.mockResolvedValue([
        release(10, '1-2026102712', '2026-10-27T12:00:00Z'),
        release(3, 'database', '2026-10-20T00:00:00Z'),
      ]);

      await upload();

      expect(octokit.repos.deleteRelease).not.toHaveBeenCalled();
    });

    it('ignores tags which are already gone', async () => {
      octokit.paginate.mockResolvedValue([
        release(10, '1-2026102712', '2026-10-27T12:00:00Z'),
        release(8, '1-2026102708', '2026-10-27T08:00:00Z'),
        release(7, '1-2026102504', '2026-10-25T04:00:00Z'),
      ]);
      octokit.git.deleteRef.mockRejectedValue(new Error('Not Found'));

      await expect(upload()).resolves.toBeUndefined();
      expect(calls).toContain('delete 7');
    });

    it.each([
      ['is missing', () => Promise.resolve(new Response('', { status: 404 }))],
      ['is invalid', () => Promise.resolve(new Response('{}'))],
      ['fails', () => Promise.reject(new Error('network'))],
    ] as const)('deletes nothing when the published index %s', async (_, response) => {
      fetch.mockImplementation(response);

      await upload();

      expect(octokit.paginate).not.toHaveBeenCalled();
      expect(octokit.repos.deleteRelease).not.toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledExactlyOnceWith(
        'https://renovatebot.github.io/osv-offline/v2/index.json',
        { headers: { 'cache-control': 'no-cache' } },
      );
    });

    it('keeps everything when an upload fails', async () => {
      octokit.repos.uploadReleaseAsset.mockRejectedValue(new Error('failed'));

      await expect(upload()).rejects.toThrow('failed');
      expect(octokit.repos.updateRelease).not.toHaveBeenCalled();
      expect(octokit.paginate).not.toHaveBeenCalled();
      expect(octokit.repos.deleteRelease).not.toHaveBeenCalled();
    });
  });
});
