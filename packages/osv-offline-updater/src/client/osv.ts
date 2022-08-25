import { format } from 'util';

import AdmZip from 'adm-zip';
import got from 'got';
import type { Ecosystem, Osv } from '@renovatebot/osv-offline-db';

export class OsvDownloader {
  private static readonly downloadUrlFormat =
    'https://osv-vulnerabilities.storage.googleapis.com/%s/all.zip';

  constructor(private readonly ecosystem: Ecosystem) {}

  public async download(): Promise<Osv.Vulnerability[]> {
    const downloadUrl = format(OsvDownloader.downloadUrlFormat, this.ecosystem);
    const response = await got.get(downloadUrl, { responseType: 'buffer' });
    return new AdmZip(response.body)
      .getEntries()
      .map(
        (entry) =>
          JSON.parse(entry.getData().toString()) as Osv.Vulnerability
      );
  }
}
