import AdmZip from 'adm-zip';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { extractZip } from './unzip.ts';

const centralDirectoryHeaderSignature = Buffer.from([0x50, 0x4b, 0x01, 0x02]);

describe('packages/osv-offline/src/lib/unzip.unit', () => {
  describe('extractZip', () => {
    let tmpDir: string;
    let zipPath: string;
    let targetDir: string;

    beforeEach(async () => {
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'osv-offline-unzip-'));
      zipPath = path.join(tmpDir, 'test.zip');
      targetDir = path.join(tmpDir, 'target');
      await fs.ensureDir(targetDir);
    });

    afterEach(async () => {
      await fs.remove(tmpDir);
    });

    async function writeZip(
      files: Record<string, string>,
      method?: number
    ): Promise<Buffer> {
      const zip = new AdmZip();
      for (const [name, content] of Object.entries(files)) {
        zip.addFile(name, Buffer.from(content));
        if (method !== undefined) {
          zip.getEntry(name)!.header.method = method;
        }
      }
      const buffer = zip.toBuffer();
      await fs.writeFile(zipPath, buffer);
      return buffer;
    }

    it('extracts deflated files', async () => {
      const content = '{"id":"GHSA-1"}\n'.repeat(1000);
      await writeZip({ 'npm.nedb': content, 'pypi.nedb': 'pypi' }, 8);

      const files = await extractZip(zipPath, targetDir);

      expect(files).toEqual(['npm.nedb', 'pypi.nedb']);
      await expect(
        fs.readFile(path.join(targetDir, 'npm.nedb'), 'utf8')
      ).resolves.toBe(content);
      await expect(
        fs.readFile(path.join(targetDir, 'pypi.nedb'), 'utf8')
      ).resolves.toBe('pypi');
    });

    it('extracts stored and empty files', async () => {
      await writeZip({ 'go.nedb': 'go', 'pub.nedb': '' }, 0);

      const files = await extractZip(zipPath, targetDir);

      expect(files).toEqual(['go.nedb', 'pub.nedb']);
      await expect(
        fs.readFile(path.join(targetDir, 'go.nedb'), 'utf8')
      ).resolves.toBe('go');
      await expect(
        fs.readFile(path.join(targetDir, 'pub.nedb'), 'utf8')
      ).resolves.toBe('');
    });

    it('extracts archives with a comment', async () => {
      const zip = new AdmZip();
      zip.addFile('npm.nedb', Buffer.from('npm'));
      zip.addZipComment('osv-offline');
      await fs.writeFile(zipPath, zip.toBuffer());

      await expect(extractZip(zipPath, targetDir)).resolves.toEqual([
        'npm.nedb',
      ]);
    });

    it('skips directory entries', async () => {
      const zip = new AdmZip();
      zip.addFile('dir/', Buffer.alloc(0));
      await fs.writeFile(zipPath, zip.toBuffer());

      await expect(extractZip(zipPath, targetDir)).resolves.toEqual([]);
    });

    it('rejects files outside of the root', async () => {
      await writeZip({ 'dir/npm.nedb': 'npm' });

      await expect(extractZip(zipPath, targetDir)).rejects.toThrow(
        'Unsupported zip entry name: dir/npm.nedb'
      );
    });

    it('rejects a file without an end of central directory', async () => {
      await fs.writeFile(zipPath, 'not a zip archive');

      await expect(extractZip(zipPath, targetDir)).rejects.toThrow(
        'end of central directory not found'
      );
    });

    it('rejects ZIP64 archives', async () => {
      const buffer = await writeZip({ 'npm.nedb': 'npm' });
      // the entry count of the end of central directory record
      buffer.writeUInt16LE(0xffff, buffer.length - 22 + 10);
      await fs.writeFile(zipPath, buffer);

      await expect(extractZip(zipPath, targetDir)).rejects.toThrow(
        'ZIP64 extensions'
      );
    });

    it('rejects a corrupt central directory', async () => {
      const buffer = await writeZip({ 'npm.nedb': 'npm' });
      buffer.writeUInt32LE(0, buffer.indexOf(centralDirectoryHeaderSignature));
      await fs.writeFile(zipPath, buffer);

      await expect(extractZip(zipPath, targetDir)).rejects.toThrow(
        'corrupt central directory'
      );
    });

    it('rejects a corrupt local header', async () => {
      const buffer = await writeZip({ 'npm.nedb': 'npm' });
      buffer.writeUInt32LE(0, 0);
      await fs.writeFile(zipPath, buffer);

      await expect(extractZip(zipPath, targetDir)).rejects.toThrow(
        'corrupt header of npm.nedb'
      );
    });

    it('rejects encrypted files', async () => {
      const buffer = await writeZip({ 'npm.nedb': 'npm' });
      const header = buffer.indexOf(centralDirectoryHeaderSignature);
      buffer.writeUInt16LE(0x1, header + 8);
      await fs.writeFile(zipPath, buffer);

      await expect(extractZip(zipPath, targetDir)).rejects.toThrow(
        'npm.nedb is encrypted'
      );
    });

    it('rejects unsupported compression methods', async () => {
      const buffer = await writeZip({ 'npm.nedb': 'npm' });
      const header = buffer.indexOf(centralDirectoryHeaderSignature);
      buffer.writeUInt16LE(12, header + 10);
      await fs.writeFile(zipPath, buffer);

      await expect(extractZip(zipPath, targetDir)).rejects.toThrow(
        'npm.nedb uses compression method 12'
      );
    });

    it('rejects files with a wrong checksum', async () => {
      const buffer = await writeZip({ 'npm.nedb': 'npm' }, 0);
      const header = buffer.indexOf(centralDirectoryHeaderSignature);
      buffer.writeUInt32LE(0, header + 16);
      await fs.writeFile(zipPath, buffer);

      await expect(extractZip(zipPath, targetDir)).rejects.toThrow(
        'checksum mismatch for npm.nedb'
      );
    });
  });
});
