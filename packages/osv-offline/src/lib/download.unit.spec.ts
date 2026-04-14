import { OsvOfflineDb } from '@renovatebot/osv-offline-db';
import fs from 'fs-extra';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tryDownloadDb } from './download';

const mockStream = vi.hoisted(() => vi.fn());

vi.mock('got', () => {
  const mockGot = { stream: mockStream };
  return {
    default: mockGot,
    got: mockGot,
  };
});

describe('packages/osv-offline/src/lib/download.unit', () => {
  describe('tryDownloadDb', () => {
    beforeEach(async () => {
      delete process.env.OSV_OFFLINE_DISABLE_DOWNLOAD;
      delete process.env.OSV_OFFLINE_DATABASE_URL;
      const zipFilePath = path.join(
        OsvOfflineDb.rootDirectory,
        'osv-offline.zip'
      );
      await fs.rm(zipFilePath, { force: true });
      vi.clearAllMocks();
    });

    it('uses default URL when OSV_OFFLINE_DATABASE_URL is not set', async () => {
      mockStream.mockImplementationOnce(() => {
        throw new Error('intentional stream error');
      });

      const result = await tryDownloadDb();

      expect(result.success).toBe(false);
      expect(mockStream).toHaveBeenCalledWith(
        'https://github.com/renovatebot/osv-offline/releases/latest/download/osv-offline.zip'
      );
    });

    it('uses OSV_OFFLINE_DATABASE_URL when set', async () => {
      const customUrl = 'https://example.com/custom-db.zip';
      process.env.OSV_OFFLINE_DATABASE_URL = customUrl;

      mockStream.mockImplementationOnce(() => {
        throw new Error('intentional stream error');
      });

      const result = await tryDownloadDb();

      expect(result.success).toBe(false);
      expect(mockStream).toHaveBeenCalledWith(customUrl);
    });
  });
});
