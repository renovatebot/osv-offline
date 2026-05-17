import { OsvOfflineDb } from '@renovatebot/osv-offline-db';
import fs from 'fs-extra';
import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tryDownloadDb } from './download.ts';

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
    });

    it('uses default URL when OSV_OFFLINE_DATABASE_URL is not set', async () => {
      const fetcher = vi
        .fn()
        .mockResolvedValue(new Response(null, { status: 500 }));

      const result = await tryDownloadDb(fetcher);

      expect(result.success).toBe(false);
      expect(fetcher).toHaveBeenCalledWith(
        'https://github.com/renovatebot/osv-offline/releases/latest/download/osv-offline.zip'
      );
    });

    it('uses OSV_OFFLINE_DATABASE_URL when set', async () => {
      const customUrl = 'https://example.com/custom-db.zip';
      process.env.OSV_OFFLINE_DATABASE_URL = customUrl;
      const fetcher = vi
        .fn()
        .mockResolvedValue(new Response(null, { status: 500 }));

      const result = await tryDownloadDb(fetcher);

      expect(result.success).toBe(false);
      expect(fetcher).toHaveBeenCalledWith(customUrl);
    });

    it('returns failure when response has no body', async () => {
      const fetcher = vi.fn().mockResolvedValue({
        ok: true,
        body: null,
        status: 200,
      });

      const result = await tryDownloadDb(fetcher);
      expect(result.success).toBe(false);
    });
  });
});
