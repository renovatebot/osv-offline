/**
 * A schema for describing a vulnerability in an open source package.
 *
 * https://github.com/ossf/osv-schema/blob/main/validation/schema.json
 */
export interface Vulnerability {
  affected?: Affected[];
  aliases?: string[];
  credits?: Credit[];
  database_specific?: { [key: string]: unknown };
  details?: string;
  id: string;
  modified: string;
  published?: string;
  references?: Reference[];
  related?: string[];
  schema_version?: string;
  severity?: Severity[];
  summary?: string;
  withdrawn?: string;
}

export interface Affected {
  database_specific?: { [key: string]: unknown };
  ecosystem_specific?: { [key: string]: unknown };
  package?: Package;
  severity?: Severity[];
  ranges?: Range[];
  versions?: string[];
}

export interface Package {
  ecosystem: string;
  name: string;
  purl?: string;
}

export interface Range {
  events: Event[];
  repo?: string;
  type: RangeType;
  database_specific?: { [key: string]: unknown };
}

export interface Event {
  introduced?: string;
  fixed?: string;
  last_affected?: string;
  limit?: string;
}

export type RangeType = 'ECOSYSTEM' | 'GIT' | 'SEMVER';

export interface Credit {
  contact?: string[];
  name: string;
}

export interface Reference {
  type: ReferenceType;
  url: string;
}

export type ReferenceType =
  | 'ADVISORY'
  | 'ARTICLE'
  | 'EVIDENCE'
  | 'FIX'
  | 'GIT'
  | 'PACKAGE'
  | 'REPORT'
  | 'WEB';

export interface Severity {
  score: string;
  type: SeverityType;
}

export type SeverityType = 'CVSS_V3';
