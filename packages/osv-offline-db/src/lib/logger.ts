import { type LogFn, type Logger, getLogger, isConfigured } from '@containerbase/base';
import debug from 'debug';

type Level = keyof Logger;

/** Prefixes the messages to the configured logger, eg. for Renovate's `logLevelRemap`. */
const prefix = 'OSV:';

/**
 * Creates a logger which logs to the logger set by `configure` of `@containerbase/base` with messages prefixed by
 * `OSV:`, or to `debug` with the given namespace when none is set.
 *
 * @param namespace the `debug` namespace
 */
export function createLogger(namespace: string): Logger {
  const fallback = debug(namespace);

  const log =
    (level: Level): LogFn =>
    (metaOrMsg: Record<string, unknown> | string, msg?: string): void => {
      if (typeof metaOrMsg === 'string') {
        if (isConfigured()) {
          getLogger()[level](`${prefix} ${metaOrMsg}`);
        } else {
          fallback(metaOrMsg);
        }
      } else if (isConfigured()) {
        getLogger()[level](metaOrMsg, msg === undefined ? prefix : `${prefix} ${msg}`);
      } else {
        fallback('%s %O', msg ?? '', metaOrMsg);
      }
    };

  return {
    trace: log('trace'),
    debug: log('debug'),
    info: log('info'),
    warn: log('warn'),
    error: log('error'),
  };
}
