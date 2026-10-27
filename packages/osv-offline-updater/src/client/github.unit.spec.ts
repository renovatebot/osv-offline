import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GitHub } from './github.ts';

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
});
