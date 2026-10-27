import { OsvOfflineDb } from '@renovatebot/osv-offline-db';
import AdmZip from 'adm-zip';
import fs from 'fs-extra';
import { Readable } from 'node:stream';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tryDownloadDb } from './download.ts';

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

    afterEach(async () => {
      await fs.rm(path.join(OsvOfflineDb.rootDirectory, 'npm.nedb'), {
        force: true,
      });
    });

    it('replaces existing databases', async () => {
      const dbPath = path.join(OsvOfflineDb.rootDirectory, 'npm.nedb');
      await fs.ensureDir(OsvOfflineDb.rootDirectory);
      await fs.writeFile(dbPath, 'old');
      const zip = new AdmZip();
      zip.addFile('npm.nedb', Buffer.from('new'));
      mockStream.mockReturnValueOnce(Readable.from([zip.toBuffer()]));

      const result = await tryDownloadDb();

      expect(result.success).toBe(true);
      await expect(fs.readFile(dbPath, 'utf8')).resolves.toBe('new');
      await expect(
        fs.pathExists(path.join(OsvOfflineDb.rootDirectory, 'osv-offline.zip'))
      ).resolves.toBe(true);
      expect(
        (await fs.readdir(OsvOfflineDb.rootDirectory)).filter((file) =>
          file.startsWith('.download-')
        )
      ).toEqual([]);
    });

    it('keeps existing databases when the download fails', async () => {
      const dbPath = path.join(OsvOfflineDb.rootDirectory, 'npm.nedb');
      await fs.ensureDir(OsvOfflineDb.rootDirectory);
      await fs.writeFile(dbPath, 'old');
      mockStream.mockReturnValueOnce(
        new Readable({
          read() {
            this.destroy(new Error('intentional stream error'));
          },
        })
      );

      const result = await tryDownloadDb();

      expect(result.success).toBe(false);
      await expect(fs.readFile(dbPath, 'utf8')).resolves.toBe('old');
      await expect(
        fs.pathExists(path.join(OsvOfflineDb.rootDirectory, 'osv-offline.zip'))
      ).resolves.toBe(false);
      expect(
        (await fs.readdir(OsvOfflineDb.rootDirectory)).filter((file) =>
          file.startsWith('.download-')
        )
      ).toEqual([]);
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
