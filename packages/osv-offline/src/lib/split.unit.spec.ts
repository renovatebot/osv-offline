import { createHash } from 'node:crypto';
import path from 'node:path';
import { Readable } from 'node:stream';
import { zstdCompressSync } from 'node:zlib';
import type { SplitIndex } from '@renovatebot/osv-offline-db';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// a directory of its own, as the database directory is read when the module is loaded
const rootDir = await vi.hoisted(async () => {
  const os = await import('node:os');
  const p = await import('node:path');
  const dir = p.join(os.tmpdir(), `osv-offline-split-${process.pid}`);
  process.env.OSV_OFFLINE_ROOT_DIR = dir;
  return dir;
});

const gotMock = vi.hoisted(() => Object.assign(vi.fn(), { stream: vi.fn() }));

vi.mock('got', () => ({ default: gotMock }));

const { SplitDownloader } = await import('./split.ts');

const database = '{"id":"GHSA-1","_id":"abc"}\n';
const databaseIndex = '{"size":28,"packages":{}}';

function compressed(content: string) {
  const data = zstdCompressSync(Buffer.from(content));
  return {
    data,
    sha256: createHash('sha256').update(data).digest('hex'),
  };
}

const db = compressed(database);
const idx = compressed(databaseIndex);

function splitIndex(dbSha = db.sha256): SplitIndex {
  return {
    schema: 2,
    generated: '2026-10-27T12:00:00Z',
    baseUrl: 'https://example.com/files/',
    ecosystems: {
      npm: {
        database: {
          file: 'npm-20261027120000.nedb.zst',
          sha256: dbSha,
          size: db.data.length,
          uncompressedSize: Buffer.byteLength(database),
        },
        index: {
          file: 'npm-20261027120000.idx.json.zst',
          sha256: idx.sha256,
          size: idx.data.length,
          uncompressedSize: Buffer.byteLength(databaseIndex),
        },
      },
    },
  };
}

function indexResponse(
  index: SplitIndex,
  lastModified = 'Tue, 27 Oct 2026 12:00:00 GMT'
) {
  return {
    statusCode: 200,
    body: JSON.stringify(index),
    headers: { 'last-modified': lastModified },
  };
}

function serveFiles() {
  gotMock.stream.mockImplementation((url: URL) =>
    Readable.from([url.pathname.endsWith('.nedb.zst') ? db.data : idx.data])
  );
}

const statePath = path.join(rootDir, 'npm.split.json');

async function writeExistingFiles(names = ['npm.nedb', 'npm.idx.json']) {
  await fs.ensureDir(rootDir);
  for (const name of names) {
    await fs.writeFile(path.join(rootDir, name), 'old');
  }
}

describe('packages/osv-offline/src/lib/split.unit', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    delete process.env.OSV_OFFLINE_DISABLE_DOWNLOAD;
    delete process.env.OSV_OFFLINE_MAX_AGE;
    delete process.env.OSV_OFFLINE_DATABASE_INDEX_URL;
    await fs.emptyDir(rootDir);
  });

  afterEach(async () => {
    vi.useRealTimers();
    await fs.remove(rootDir);
  });

  it('downloads the files of an ecosystem and records their checksums', async () => {
    gotMock.mockResolvedValue(indexResponse(splitIndex()));
    serveFiles();

    await new SplitDownloader().ensure('npm');

    expect(gotMock).toHaveBeenCalledExactlyOnceWith(
      new URL('https://renovatebot.github.io/osv-offline/v2/index.json'),
      { headers: {} }
    );
    expect(gotMock.stream.mock.calls.map(([url]) => String(url))).toEqual([
      'https://example.com/files/npm-20261027120000.idx.json.zst',
      'https://example.com/files/npm-20261027120000.nedb.zst',
    ]);
    await expect(
      fs.readFile(path.join(rootDir, 'npm.nedb'), 'utf8')
    ).resolves.toBe(database);
    await expect(
      fs.readFile(path.join(rootDir, 'npm.idx.json'), 'utf8')
    ).resolves.toBe(databaseIndex);
    await expect(fs.readJson(statePath)).resolves.toEqual({
      database: db.sha256,
      index: idx.sha256,
    });
    expect(
      (await fs.readdir(rootDir)).filter((f) => f.startsWith('.download-'))
    ).toEqual([]);
  });

  it('resolves files relative to the index without base URL', async () => {
    process.env.OSV_OFFLINE_DATABASE_INDEX_URL =
      'https://mirror.example.com/osv/index.json';
    gotMock.mockResolvedValue(
      indexResponse({ ...splitIndex(), baseUrl: undefined })
    );
    serveFiles();

    await new SplitDownloader().ensure('npm');

    expect(String(gotMock.stream.mock.calls[0]?.[0])).toBe(
      'https://mirror.example.com/osv/npm-20261027120000.idx.json.zst'
    );
  });

  it('checks an ecosystem only once within the maximum age', async () => {
    gotMock.mockResolvedValue(indexResponse(splitIndex()));
    serveFiles();
    const downloader = new SplitDownloader();

    await downloader.ensure('npm');
    await downloader.ensure('npm');

    expect(gotMock).toHaveBeenCalledOnce();
  });

  it.each([
    ['database and index', ['npm.nedb', 'npm.idx.json']],
    ['database without index', ['npm.nedb']],
  ])(
    'skips the download while the recorded %s are younger than the maximum age',
    async (_, names) => {
      await writeExistingFiles(names);
      await fs.writeJson(statePath, { database: 'x', index: 'y' });

      await new SplitDownloader().ensure('npm');

      expect(gotMock).not.toHaveBeenCalled();
    }
  );

  it('downloads again when the recorded database is missing', async () => {
    await writeExistingFiles(['npm.idx.json']);
    await fs.writeJson(statePath, { database: db.sha256, index: idx.sha256 });
    gotMock.mockResolvedValue(indexResponse(splitIndex()));
    serveFiles();

    await new SplitDownloader().ensure('npm');

    await expect(
      fs.readFile(path.join(rootDir, 'npm.nedb'), 'utf8')
    ).resolves.toBe(database);
  });

  it('only touches the state when the checksums are unchanged', async () => {
    process.env.OSV_OFFLINE_MAX_AGE = '1h';
    await writeExistingFiles();
    await fs.writeJson(statePath, { database: db.sha256, index: idx.sha256 });
    const old = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await fs.utimes(statePath, old, old);
    gotMock.mockResolvedValue(indexResponse(splitIndex()));

    await new SplitDownloader().ensure('npm');

    expect(gotMock.stream).not.toHaveBeenCalled();
    expect((await fs.stat(statePath)).mtimeMs).toBeGreaterThan(old.getTime());
  });

  it('reuses the index when it was not modified', async () => {
    process.env.OSV_OFFLINE_MAX_AGE = '1ms';
    gotMock
      .mockResolvedValueOnce(indexResponse(splitIndex()))
      .mockResolvedValueOnce({ statusCode: 304, body: '', headers: {} });
    serveFiles();
    const downloader = new SplitDownloader();

    await downloader.ensure('npm');
    await new Promise((resolve) => setTimeout(resolve, 5));
    await downloader.ensure('npm');

    expect(gotMock).toHaveBeenLastCalledWith(expect.any(URL), {
      headers: { 'if-modified-since': 'Tue, 27 Oct 2026 12:00:00 GMT' },
    });
    // unchanged checksums, so the files were downloaded only once
    expect(gotMock.stream).toHaveBeenCalledTimes(2);
  });

  it('retries with a fresh index when a file is not found', async () => {
    gotMock.mockResolvedValue(indexResponse(splitIndex()));
    gotMock.stream
      .mockImplementationOnce(() => {
        const stream = new Readable({
          read() {
            this.destroy(
              Object.assign(new Error('Not Found'), {
                response: { statusCode: 404 },
              })
            );
          },
        });
        return stream;
      })
      .mockImplementation((url: URL) =>
        Readable.from([url.pathname.endsWith('.nedb.zst') ? db.data : idx.data])
      );

    await new SplitDownloader().ensure('npm');

    expect(gotMock).toHaveBeenCalledTimes(2);
    const [url, options] = gotMock.mock.calls[1] as [
      URL,
      { headers: Record<string, string> },
    ];
    expect(url.searchParams.has('t')).toBe(true);
    expect(options.headers).toEqual({ 'cache-control': 'no-cache' });
    await expect(
      fs.readFile(path.join(rootDir, 'npm.nedb'), 'utf8')
    ).resolves.toBe(database);
  });

  it.each`
    reason                        | index
    ${'the checksum differs'}     | ${() => splitIndex('0'.repeat(64))}
    ${'the file is too large'}    | ${() => ({ ...splitIndex(), ecosystems: { npm: { ...splitIndex().ecosystems.npm, database: { ...splitIndex().ecosystems.npm?.database, size: 1 } } } })}
    ${'the content is too large'} | ${() => ({ ...splitIndex(), ecosystems: { npm: { ...splitIndex().ecosystems.npm, database: { ...splitIndex().ecosystems.npm?.database, uncompressedSize: 1 } } } })}
  `(
    'keeps the existing files when $reason',
    async ({ index }: { index: () => SplitIndex }) => {
      await writeExistingFiles();
      gotMock.mockResolvedValue(indexResponse(index()));
      serveFiles();

      await new SplitDownloader().ensure('npm');

      await expect(
        fs.readFile(path.join(rootDir, 'npm.nedb'), 'utf8')
      ).resolves.toBe('old');
      await expect(fs.pathExists(statePath)).resolves.toBe(false);
    }
  );

  it('keeps an existing database without its index file when index.json is invalid', async () => {
    await writeExistingFiles(['npm.nedb']);
    gotMock.mockResolvedValue({
      statusCode: 200,
      body: 'not json',
      headers: {},
    });

    await expect(new SplitDownloader().ensure('npm')).resolves.toBeUndefined();
    expect(gotMock.stream).not.toHaveBeenCalled();
  });

  it('fails without existing files and retries after a delay', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: Date.now() });
    gotMock
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(indexResponse(splitIndex()));
    serveFiles();
    const downloader = new SplitDownloader();

    await expect(downloader.ensure('npm')).rejects.toThrow('offline');
    await expect(downloader.ensure('npm')).rejects.toThrow('offline');
    expect(gotMock).toHaveBeenCalledOnce();

    vi.setSystemTime(Date.now() + 5 * 60 * 1000);
    await downloader.ensure('npm');

    expect(gotMock).toHaveBeenCalledTimes(2);
    await expect(
      fs.readFile(path.join(rootDir, 'npm.nedb'), 'utf8')
    ).resolves.toBe(database);
  });

  it('keeps the existing database and retries after a delay', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: Date.now() });
    await writeExistingFiles(['npm.nedb']);
    gotMock.mockRejectedValue(new Error('offline'));
    const downloader = new SplitDownloader();

    await downloader.ensure('npm');
    await downloader.ensure('npm');
    expect(gotMock).toHaveBeenCalledOnce();

    vi.setSystemTime(Date.now() + 5 * 60 * 1000);
    await downloader.ensure('npm');

    expect(gotMock).toHaveBeenCalledTimes(2);
  });

  it('replaces an update which never settles after the maximum age', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: Date.now() });
    process.env.OSV_OFFLINE_MAX_AGE = '1h';
    gotMock
      .mockReturnValueOnce(new Promise(() => undefined))
      .mockResolvedValue(indexResponse(splitIndex()));
    serveFiles();
    const downloader = new SplitDownloader();

    void downloader.ensure('npm');
    await vi.waitFor(() => expect(gotMock).toHaveBeenCalledOnce());
    vi.setSystemTime(Date.now() + 60 * 60 * 1000);
    await downloader.ensure('npm');

    expect(gotMock).toHaveBeenCalledTimes(2);
  });

  it('checks files recorded with a time in the future', async () => {
    await writeExistingFiles();
    await fs.writeJson(statePath, { database: db.sha256, index: idx.sha256 });
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await fs.utimes(statePath, future, future);
    gotMock.mockResolvedValue(indexResponse(splitIndex()));

    await new SplitDownloader().ensure('npm');

    expect(gotMock).toHaveBeenCalledOnce();
    expect((await fs.stat(statePath)).mtimeMs).toBeLessThan(future.getTime());
  });

  it('records the time of the index the files were checked against', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: Date.now() });
    process.env.OSV_OFFLINE_MAX_AGE = '1h';
    gotMock.mockResolvedValue(indexResponse(splitIndex()));
    serveFiles();
    const downloader = new SplitDownloader();
    const fetched = Date.now();

    // fetches the index, which has no files for PyPI
    await downloader.ensure('PyPI');
    // npm is downloaded later, from the same index
    vi.setSystemTime(fetched + 30 * 60 * 1000);
    await downloader.ensure('npm');

    expect(gotMock).toHaveBeenCalledOnce();
    expect(Math.round((await fs.stat(statePath)).mtimeMs / 1000)).toBe(
      Math.round(fetched / 1000)
    );
  });

  it('checks again once the recorded files reach the maximum age', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: Date.now() });
    process.env.OSV_OFFLINE_MAX_AGE = '1h';
    await writeExistingFiles();
    await fs.writeJson(statePath, { database: db.sha256, index: idx.sha256 });
    const recorded = new Date(Date.now() - 50 * 60 * 1000);
    await fs.utimes(statePath, recorded, recorded);
    gotMock.mockResolvedValue(indexResponse(splitIndex()));
    const downloader = new SplitDownloader();

    await downloader.ensure('npm');
    expect(gotMock).not.toHaveBeenCalled();

    // the files are now older than an hour, although the first check was less than an hour ago
    vi.setSystemTime(Date.now() + 11 * 60 * 1000);
    await downloader.ensure('npm');

    expect(gotMock).toHaveBeenCalledOnce();
  });

  it('fetches the index once for several ecosystems', async () => {
    gotMock.mockResolvedValue(indexResponse(splitIndex()));
    serveFiles();
    const downloader = new SplitDownloader();

    await downloader.ensure('npm');
    await downloader.ensure('PyPI');

    expect(gotMock).toHaveBeenCalledOnce();
  });

  it('ignores ecosystems missing from the index', async () => {
    gotMock.mockResolvedValue(indexResponse(splitIndex()));

    await new SplitDownloader().ensure('PyPI');

    expect(gotMock.stream).not.toHaveBeenCalled();
  });

  it('does nothing when downloads are disabled', async () => {
    process.env.OSV_OFFLINE_DISABLE_DOWNLOAD = 'true';

    await new SplitDownloader().ensure('npm');

    expect(gotMock).not.toHaveBeenCalled();
  });
});
