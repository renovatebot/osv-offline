import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { format } from 'util';
import type { Ecosystem } from '@renovatebot/osv-offline-db';
import got from 'got';

export class OsvDownloader {
  private static readonly downloadUrlFormat =
    'https://osv-vulnerabilities.storage.googleapis.com/%s/all.zip';

  private readonly ecosystem: Ecosystem;

  constructor(ecosystem: Ecosystem) {
    this.ecosystem = ecosystem;
  }

  /**
   * Downloads the `all.zip` of the ecosystem to `target`, without buffering it in memory.
   */
  public async download(target: string): Promise<void> {
    const downloadUrl = format(OsvDownloader.downloadUrlFormat, this.ecosystem);
    await pipeline(got.stream(downloadUrl), createWriteStream(target));
  }
}
