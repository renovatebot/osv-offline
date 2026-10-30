import { type Logger, configure } from '@containerbase/base';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ debug: vi.fn() }));

vi.mock('debug', () => ({ default: () => mocks.debug }));

const { createLogger } = await import('./logger.ts');

describe('packages/osv-offline-db/src/lib/logger.unit', () => {
  afterEach(() => {
    configure();
    vi.resetAllMocks();
  });

  function mockLogger(): Logger {
    return {
      trace: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
  }

  it('logs to debug without a configured logger', () => {
    const logger = createLogger('osv-offline:test');

    logger.debug('message');
    logger.warn({ ecosystem: 'npm' }, 'meta');
    logger.info({ ecosystem: 'npm' });

    expect(mocks.debug.mock.calls).toEqual([
      ['message'],
      ['%s %O', 'meta', { ecosystem: 'npm' }],
      ['%s %O', '', { ecosystem: 'npm' }],
    ]);
  });

  it('logs to the configured logger', () => {
    const logger = createLogger('osv-offline:test');
    const configured = mockLogger();
    configure({ logger: configured });

    logger.trace('trace');
    logger.debug('debug');
    logger.info('info');
    logger.warn({ ecosystem: 'npm' }, 'warn');
    logger.error({ ecosystem: 'npm' });

    expect(configured.trace).toHaveBeenCalledExactlyOnceWith('OSV: trace');
    expect(configured.debug).toHaveBeenCalledExactlyOnceWith('OSV: debug');
    expect(configured.info).toHaveBeenCalledExactlyOnceWith('OSV: info');
    expect(configured.warn).toHaveBeenCalledExactlyOnceWith({ ecosystem: 'npm' }, 'OSV: warn');
    expect(configured.error).toHaveBeenCalledExactlyOnceWith({ ecosystem: 'npm' }, 'OSV:');
    expect(mocks.debug).not.toHaveBeenCalled();
  });

  it('logs to debug again after a reset', () => {
    const logger = createLogger('osv-offline:test');
    const configured = mockLogger();
    configure({ logger: configured });
    configure();

    logger.debug('message');

    expect(configured.debug).not.toHaveBeenCalled();
    expect(mocks.debug).toHaveBeenCalledExactlyOnceWith('message');
  });
});
