import {
  type Ecosystem,
  OsvOfflineDb,
  type SplitEcosystem,
  type SplitFile,
  type SplitIndex,
  getIndexFileName,
  parseSplitIndex,
} from '@renovatebot/osv-offline-db';
import debug from 'debug';
import fs from 'fs-extra';
import got from 'got';
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { Transform, type TransformCallback } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createZstdDecompress } from 'node:zlib';
import { getMaxAge } from './download.ts';

const logger = debug('osv-offline:split');

const defaultIndexUrl =
  'https://renovatebot.github.io/osv-offline/v2/index.json';

/** how long to wait before retrying a failed update, so an unreachable host isn't requested on every query */
const retryDelay = 5 * 60 * 1000;

/** the checksums of the files of an ecosystem which were downloaded last */
type SplitState = Record<keyof SplitEcosystem, string>;

/**
 * Passes the data through, computing its SHA-256, and fails when it's larger than `maxSize`.
 */
class Digest extends Transform {
  private readonly hash = createHash('sha256');
  private size = 0;

  constructor(
    private readonly maxSize: number,
    private readonly name: string
  ) {
    super();
  }

  override _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    this.size += chunk.length;
    if (this.size > this.maxSize) {
      callback(new Error(`${this.name} is larger than ${this.maxSize} bytes`));
      return;
    }
    this.hash.update(chunk);
    callback(null, chunk);
  }

  digest(): string {
    return this.hash.digest('hex');
  }
}

function getDatabaseFileName(ecosystem: Ecosystem): string {
  return `${ecosystem.toLowerCase()}.nedb`;
}

function isNotFound(err: unknown): boolean {
  return (
    (err as { response?: { statusCode?: number } }).response?.statusCode === 404
  );
}

/**
 * Downloads the databases of the split format: each ecosystem on its first use, and again only when it changed.
 */
export class SplitDownloader {
  private readonly indexUrl =
    process.env.OSV_OFFLINE_DATABASE_INDEX_URL ?? defaultIndexUrl;
  private readonly maxAge = getMaxAge();
  private index:
    { value: SplitIndex; fetched: number; lastModified?: string } | undefined;
  private readonly checked = new Map<
    Ecosystem,
    { promise: Promise<void>; expires: number }
  >();

  /**
   * Makes sure the files of `ecosystem` are up-to-date. Failures are logged and existing files are kept; without an
   * existing database, failures are thrown. A failed update is retried after a short delay.
   */
  ensure(ecosystem: Ecosystem): Promise<void> {
    if (process.env.OSV_OFFLINE_DISABLE_DOWNLOAD?.toLowerCase() === 'true') {
      return Promise.resolve();
    }
    const checked = this.checked.get(ecosystem);
    if (checked && Date.now() < checked.expires) {
      return checked.promise;
    }
    // concurrent calls share the update until it's done
    const entry = { promise: Promise.resolve(), expires: Infinity };
    entry.promise = (async () => {
      try {
        entry.expires = (await this.update(ecosystem)) + this.maxAge;
      } catch (err) {
        entry.expires = Date.now() + Math.min(retryDelay, this.maxAge);
        if (!(await this.hasDatabase(ecosystem))) {
          throw err;
        }
        logger(`Updating ecosystem '${ecosystem}' failed: ${String(err)}`);
      }
    })();
    this.checked.set(ecosystem, entry);
    return entry.promise;
  }

  /**
   * Updates the files of `ecosystem` when needed, and returns when they were last checked against the index.
   */
  private async update(ecosystem: Ecosystem): Promise<number> {
    const statePath = this.getStatePath(ecosystem);
    const stateStat = await fs.stat(statePath).catch(() => null);
    if (
      stateStat &&
      Date.now() - stateStat.mtimeMs < this.maxAge &&
      (await this.hasDatabase(ecosystem))
    ) {
      logger(`Ecosystem '${ecosystem}' is up-to-date.`);
      return stateStat.mtimeMs;
    }

    try {
      await this.updateFromIndex(ecosystem, false);
    } catch (err) {
      if (!isNotFound(err)) {
        throw err;
      }
      // the index may be outdated, e.g. served by a caching proxy
      logger(`File of ecosystem '${ecosystem}' not found, retrying ...`);
      await this.updateFromIndex(ecosystem, true);
    }
    return Date.now();
  }

  private async updateFromIndex(
    ecosystem: Ecosystem,
    refresh: boolean
  ): Promise<void> {
    const index = await this.getIndex(refresh);
    const files = index.ecosystems[ecosystem];
    if (!files) {
      logger(`No files for ecosystem '${ecosystem}' in the index.`);
      return;
    }

    const statePath = this.getStatePath(ecosystem);
    const state = (await fs
      .readJson(statePath)
      .catch(() => null)) as SplitState | null;
    if (
      state?.database === files.database.sha256 &&
      state.index === files.index.sha256 &&
      (await this.hasDatabase(ecosystem))
    ) {
      logger(`Ecosystem '${ecosystem}' is unchanged.`);
      const now = new Date();
      await fs.utimes(statePath, now, now);
      return;
    }

    logger(`Downloading ecosystem '${ecosystem}' ...`);
    await fs.ensureDir(OsvOfflineDb.rootDirectory);
    const tmpDir = await fs.mkdtemp(
      path.join(OsvOfflineDb.rootDirectory, '.download-')
    );
    try {
      const baseUrl = index.baseUrl ?? this.indexUrl;
      const indexPath = path.join(tmpDir, getIndexFileName(ecosystem));
      const databasePath = path.join(tmpDir, getDatabaseFileName(ecosystem));
      await this.download(
        new URL(files.index.file, baseUrl),
        files.index,
        indexPath
      );
      await this.download(
        new URL(files.database.file, baseUrl),
        files.database,
        databasePath
      );
      // the index first, so a reader never pairs a new database with an old index; it checks they match anyway
      for (const file of [indexPath, databasePath]) {
        await fs.rename(
          file,
          path.join(OsvOfflineDb.rootDirectory, path.basename(file))
        );
      }
      const newState: SplitState = {
        database: files.database.sha256,
        index: files.index.sha256,
      };
      await fs.writeJson(statePath, newState);
      logger(`Downloading ecosystem '${ecosystem}' done.`);
    } finally {
      await fs.remove(tmpDir);
    }
  }

  /**
   * Returns the index, fetching it when it's missing, older than the maximum age, or `refresh` is set.
   */
  private async getIndex(refresh: boolean): Promise<SplitIndex> {
    if (
      this.index &&
      !refresh &&
      Date.now() - this.index.fetched < this.maxAge
    ) {
      return this.index.value;
    }
    const url = new URL(this.indexUrl);
    const headers: Record<string, string> = {};
    if (refresh) {
      // bypass caching proxies, which may still serve an outdated index
      url.searchParams.set('t', Date.now().toString());
      headers['cache-control'] = 'no-cache';
    } else if (this.index?.lastModified) {
      headers['if-modified-since'] = this.index.lastModified;
    }
    const response = await got(url, { headers });
    if (response.statusCode === 304 && this.index) {
      this.index.fetched = Date.now();
      return this.index.value;
    }
    const index = parseSplitIndex(response.body);
    if (!index) {
      throw new Error(`Invalid index at ${this.indexUrl}`);
    }
    this.index = {
      value: index,
      fetched: Date.now(),
      lastModified: response.headers['last-modified'],
    };
    return index;
  }

  /**
   * Downloads a compressed file, decompresses it to `target`, and checks its size and SHA-256.
   */
  private async download(
    url: URL,
    file: SplitFile,
    target: string
  ): Promise<void> {
    const digest = new Digest(file.size, file.file);
    // limits the decompressed size, so a broken or malicious file can't fill the disk
    const limit = new Digest(file.uncompressedSize, file.file);
    await pipeline(
      got.stream(url),
      digest,
      createZstdDecompress(),
      limit,
      createWriteStream(target)
    );
    if (digest.digest() !== file.sha256) {
      throw new Error(`Checksum mismatch for ${file.file}`);
    }
  }

  /**
   * Whether the database of `ecosystem` exists. Its index is optional, the database is read without it.
   */
  private async hasDatabase(ecosystem: Ecosystem): Promise<boolean> {
    return await fs.pathExists(
      path.join(OsvOfflineDb.rootDirectory, getDatabaseFileName(ecosystem))
    );
  }

  private getStatePath(ecosystem: Ecosystem): string {
    return path.join(
      OsvOfflineDb.rootDirectory,
      `${ecosystem.toLowerCase()}.split.json`
    );
  }
}
