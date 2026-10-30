import os from 'node:os';
import path from 'node:path';
import AdmZip from 'adm-zip';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readVulnerabilities } from './osv-zip.ts';

const centralDirectoryHeaderSignature = Buffer.from([0x50, 0x4b, 0x01, 0x02]);

describe('packages/osv-offline-updater/src/lib/osv-zip.unit', () => {
  describe('readVulnerabilities', () => {
    let tmpDir: string;
    let zipPath: string;

    beforeEach(async () => {
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'osv-offline-zip-'));
      zipPath = path.join(tmpDir, 'all.zip');
    });

    afterEach(async () => {
      await fs.remove(tmpDir);
    });

    async function writeZip(
      files: Record<string, string>,
      method: number
    ): Promise<Buffer> {
      const zip = new AdmZip();
      for (const [name, content] of Object.entries(files)) {
        zip.addFile(name, Buffer.from(content));
        const entry = zip.getEntry(name);
        if (entry) {
          entry.header.method = method;
        }
      }
      const buffer = zip.toBuffer();
      await fs.writeFile(zipPath, buffer);
      return buffer;
    }

    it.each([
      ['deflated', 8],
      ['stored', 0],
    ])('reads %s entries one by one', async (_, method) => {
      await writeZip(
        {
          'GHSA-1.json': '{"id":"GHSA-1","summary":"ä"}',
          'GHSA-2.json': '{"id":"GHSA-2"}',
        },
        method
      );

      const vulnerabilities = await Array.fromAsync(
        readVulnerabilities(zipPath)
      );

      expect(vulnerabilities).toEqual([
        { id: 'GHSA-1', summary: 'ä' },
        { id: 'GHSA-2' },
      ]);
    });

    it('rejects entries with a wrong CRC-32', async () => {
      const buffer = await writeZip({ 'GHSA-1.json': '{"id":"GHSA-1"}' }, 0);
      const header = buffer.indexOf(centralDirectoryHeaderSignature);
      // the CRC-32 of the entry's central directory header
      buffer.writeUInt32LE(0, header + 16);
      await fs.writeFile(zipPath, buffer);

      await expect(
        Array.fromAsync(readVulnerabilities(zipPath))
      ).rejects.toThrow('CRC-32 mismatch for GHSA-1.json');
    });

    it('rejects invalid archives', async () => {
      await fs.writeFile(zipPath, 'not a zip archive');

      await expect(
        Array.fromAsync(readVulnerabilities(zipPath))
      ).rejects.toThrow();
    });
  });
});
