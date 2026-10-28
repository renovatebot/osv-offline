import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  tryDownloadDb: vi.fn(),
  ensure: vi.fn(),
  query: vi.fn(),
}));

vi.mock('./download.ts', () => ({ tryDownloadDb: mocks.tryDownloadDb }));
vi.mock('./split.ts', () => ({
  SplitDownloader: class {
    ensure = mocks.ensure;
  },
}));
vi.mock('@renovatebot/osv-offline-db', () => ({
  OsvOfflineDb: {
    create: () => ({ query: mocks.query, [Symbol.dispose]: vi.fn() }),
  },
}));

const { OsvOffline } = await import('./osv-offline.ts');

describe('packages/osv-offline/src/lib/osv-offline.unit', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.tryDownloadDb.mockResolvedValue({ success: true });
    mocks.query.mockResolvedValue([]);
  });

  afterEach(() => {
    delete process.env.OSV_OFFLINE_DATABASE_FORMAT;
  });

  it('downloads the zip on creation by default', async () => {
    using osvOffline = await OsvOffline.create();
    await osvOffline.getVulnerabilities('npm', 'lodash');

    expect(mocks.tryDownloadDb).toHaveBeenCalledOnce();
    expect(mocks.ensure).not.toHaveBeenCalled();
  });

  it('fails creation when the zip download fails', async () => {
    mocks.tryDownloadDb.mockResolvedValue({
      success: false,
      error: new Error('failed'),
    });

    await expect(OsvOffline.create()).rejects.toThrow('failed');
  });

  it('downloads the queried ecosystem in the split format', async () => {
    process.env.OSV_OFFLINE_DATABASE_FORMAT = 'split';

    using osvOffline = await OsvOffline.create();
    await osvOffline.getVulnerabilities('npm', 'lodash');

    expect(mocks.tryDownloadDb).not.toHaveBeenCalled();
    expect(mocks.ensure).toHaveBeenCalledExactlyOnceWith('npm');
    expect(mocks.query).toHaveBeenCalledExactlyOnceWith('npm', 'lodash');
  });
});
