import { format } from 'util';

import AdmZip from 'adm-zip';
import type { Ecosystem, Osv } from '@renovatebot/osv-offline-db';

export type Fetcher = typeof globalThis.fetch;

export class OsvDownloader {
  private static readonly downloadUrlFormat =
    'https://osv-vulnerabilities.storage.googleapis.com/%s/all.zip';

  constructor(
    private readonly ecosystem: Ecosystem,
    private readonly fetcher: Fetcher = globalThis.fetch
  ) {}

  public async download(): Promise<Osv.Vulnerability[]> {
    const downloadUrl = format(OsvDownloader.downloadUrlFormat, this.ecosystem);
    const response = await this.fetcher(downloadUrl);
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }
    return new AdmZip(Buffer.from(await response.arrayBuffer()))
      .getEntries()
      .map(
        (entry) => JSON.parse(entry.getData().toString()) as Osv.Vulnerability
      );
  }
}
