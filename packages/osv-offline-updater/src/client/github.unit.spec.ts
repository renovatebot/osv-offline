import type { SplitIndex } from '@renovatebot/osv-offline-db';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GitHub } from './github.ts';

const octokit = vi.hoisted(() => ({
  paginate: vi.fn(),
  git: {
    createTag: vi.fn(),
    deleteRef: vi.fn(),
  },
  repos: {
    getBranch: vi.fn(),
    getReleaseByTag: vi.fn(),
    listReleases: vi.fn(),
    listReleaseAssets: vi.fn(),
    createRelease: vi.fn(),
    updateRelease: vi.fn(),
    deleteRelease: vi.fn(),
    uploadReleaseAsset: vi.fn(),
    deleteReleaseAsset: vi.fn(),
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

function release(id: number, tag: string, createdAt: string, draft = false) {
  return { id, tag_name: tag, created_at: createdAt, draft };
}

describe('packages/osv-offline-updater/src/client/github.unit', () => {
  describe('uploadDatabase', () => {
    const calls: string[] = [];

    beforeEach(() => {
      vi.clearAllMocks();
      calls.length = 0;
      octokit.repos.getBranch.mockResolvedValue({
        data: { commit: { sha: 'abc' } },
      });
      octokit.git.createTag.mockResolvedValue({
        data: { tag: '1-2026102712' },
      });
      octokit.repos.createRelease.mockImplementation(() => {
        calls.push('create');
        return Promise.resolve({ data: { id: 10 } });
      });
      octokit.repos.uploadReleaseAsset.mockImplementation(() => {
        calls.push('upload');
        return Promise.resolve();
      });
      octokit.repos.updateRelease.mockImplementation(() => {
        calls.push('publish');
        return Promise.resolve();
      });
      octokit.repos.deleteRelease.mockImplementation(
        ({ release_id }: { release_id: number }) => {
          calls.push(`delete ${release_id}`);
          return Promise.resolve();
        }
      );
      octokit.git.deleteRef.mockResolvedValue(undefined);
      octokit.paginate.mockResolvedValue([]);
    });

    it('publishes the release as latest only after uploading the database', async () => {
      await new GitHub().uploadDatabase(Buffer.from('zip'));

      expect(octokit.repos.createRelease).toHaveBeenCalledWith(
        expect.objectContaining({ tag_name: '1-2026102712', draft: true })
      );
      expect(octokit.repos.updateRelease).toHaveBeenCalledWith(
        expect.objectContaining({
          release_id: 10,
          draft: false,
          make_latest: 'true',
        })
      );
      expect(calls).toEqual(['create', 'upload', 'publish']);
    });

    it('deletes only old database releases and their tags, after publishing', async () => {
      octokit.paginate.mockResolvedValue([
        release(10, '1-2026102712', '2026-10-27T12:00:00Z'),
        release(9, '4.1.0', '2026-10-27T11:09:00Z'),
        release(8, '1-2026102708', '2026-10-27T08:00:00Z'),
        release(7, '1-2026102704', '2026-10-27T04:00:00Z'),
        release(6, '1-2026102700', '2026-10-27T00:00:00Z'),
        release(5, '1-2026102620', '2026-10-26T20:00:00Z', true),
      ]);

      await new GitHub().uploadDatabase(Buffer.from('zip'));

      expect(calls).toEqual([
        'create',
        'upload',
        'publish',
        'delete 7',
        'delete 6',
      ]);
      expect(octokit.git.deleteRef.mock.calls).toEqual([
        [expect.objectContaining({ ref: 'tags/1-2026102704' })],
        [expect.objectContaining({ ref: 'tags/1-2026102700' })],
      ]);
    });

    it('ignores tags which are already gone', async () => {
      octokit.paginate.mockResolvedValue([
        release(10, '1-2026102712', '2026-10-27T12:00:00Z'),
        release(8, '1-2026102708', '2026-10-27T08:00:00Z'),
        release(7, '1-2026102704', '2026-10-27T04:00:00Z'),
      ]);
      octokit.git.deleteRef.mockRejectedValue(new Error('Not Found'));

      await expect(
        new GitHub().uploadDatabase(Buffer.from('zip'))
      ).resolves.toBeUndefined();
      expect(calls).toContain('delete 7');
    });

    it('keeps everything when the upload fails', async () => {
      octokit.repos.uploadReleaseAsset.mockRejectedValue(new Error('failed'));

      await expect(
        new GitHub().uploadDatabase(Buffer.from('zip'))
      ).rejects.toThrow('failed');
      expect(octokit.repos.updateRelease).not.toHaveBeenCalled();
      expect(octokit.paginate).not.toHaveBeenCalled();
      expect(octokit.repos.deleteRelease).not.toHaveBeenCalled();
    });
  });

  describe('uploadSplitFiles', () => {
    let directory: string;

    function file(name: string) {
      return {
        file: name,
        sha256: 'a'.repeat(64),
        size: 3,
        uncompressedSize: 3,
      };
    }

    const index: SplitIndex = {
      schema: 2,
      generated: '2026-10-27T12:00:00Z',
      ecosystems: {
        npm: {
          database: file('npm-2026102712.nedb.zst'),
          index: file('npm-2026102712.idx.json.zst'),
        },
      },
    };

    function asset(id: number, name: string) {
      return { id, name };
    }

    beforeEach(async () => {
      vi.resetAllMocks();
      vi.useFakeTimers({ now: new Date('2026-10-27T12:00:00Z') });
      octokit.repos.uploadReleaseAsset.mockResolvedValue(undefined);
      octokit.repos.deleteReleaseAsset.mockResolvedValue(undefined);
      directory = await fs.mkdtemp(path.join(os.tmpdir(), 'osv-offline-gh-'));
      await fs.writeFile(path.join(directory, 'npm-2026102712.nedb.zst'), 'db');
      await fs.writeFile(
        path.join(directory, 'npm-2026102712.idx.json.zst'),
        'idx'
      );
      octokit.repos.getReleaseByTag.mockResolvedValue({ data: { id: 20 } });
      octokit.paginate.mockResolvedValue([]);
    });

    afterEach(async () => {
      vi.useRealTimers();
      await fs.remove(directory);
    });

    it('creates the release when missing, never as latest', async () => {
      octokit.repos.getReleaseByTag.mockRejectedValue({ status: 404 });
      octokit.repos.createRelease.mockResolvedValue({ data: { id: 21 } });

      await new GitHub().uploadSplitFiles(directory, index);

      expect(octokit.repos.createRelease).toHaveBeenCalledWith(
        expect.objectContaining({ tag_name: 'database', make_latest: 'false' })
      );
      expect(octokit.repos.uploadReleaseAsset).toHaveBeenCalledWith(
        expect.objectContaining({ release_id: 21 })
      );
    });

    it('fails on other errors than a missing release', async () => {
      octokit.repos.getReleaseByTag.mockRejectedValue({ status: 500 });

      await expect(
        new GitHub().uploadSplitFiles(directory, index)
      ).rejects.toEqual({ status: 500 });
      expect(octokit.repos.createRelease).not.toHaveBeenCalled();
    });

    it('uploads only the files which are missing', async () => {
      octokit.paginate.mockResolvedValue([asset(1, 'npm-2026102712.nedb.zst')]);

      await new GitHub().uploadSplitFiles(directory, index);

      expect(octokit.repos.uploadReleaseAsset).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          release_id: 20,
          name: 'npm-2026102712.idx.json.zst',
          headers: expect.objectContaining({
            'content-type': 'application/zstd',
            'content-length': 3,
          }) as unknown,
        })
      );
    });

    it('deletes files older than the retention, except the newest version of each file', async () => {
      octokit.paginate.mockResolvedValue([
        asset(1, 'npm-2026102712.nedb.zst'),
        asset(7, 'npm-2026102712.idx.json.zst'),
        // exactly 28 hours old
        asset(2, 'npm-2026102608.nedb.zst'),
        // older than 28 hours
        asset(3, 'npm-2026102604.nedb.zst'),
        asset(4, 'npm-2026102604.idx.json.zst'),
        // the newest version of this file, so it's kept although it's old
        asset(5, 'pypi-2026102000.nedb.zst'),
        // not a file of the split format
        asset(6, 'notes.txt'),
      ]);

      await new GitHub().uploadSplitFiles(directory, index);

      expect(octokit.repos.deleteReleaseAsset.mock.calls).toEqual([
        [expect.objectContaining({ asset_id: 3 })],
        [expect.objectContaining({ asset_id: 4 })],
      ]);
    });
  });
});
