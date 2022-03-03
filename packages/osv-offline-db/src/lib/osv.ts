/**
 * A schema for describing a vulnerability in an open source package.
 */
export interface Vulnerability {
  affected?: Affected[];
  aliases?: string[];
  credits?: Credit[];
  databaseSpecific?: { [key: string]: unknown };
  details?: string;
  id: string;
  modified: Date;
  published?: Date;
  references?: Reference[];
  related?: string[];
  schemaVersion?: string;
  severity?: Severity[];
  summary?: string;
  withdrawn?: Date;
}

export interface Affected {
  databaseSpecific?: { [key: string]: unknown };
  ecosystemSpecific?: { [key: string]: unknown };
  package?: Package;
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
}

export interface Event {
  introduced?: string;
  fixed?: string;
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
  |'ADVISORY'
  |'ARTICLE'
  |'FIX'
  |'GIT'
  |'PACKAGE'
  |'REPORT'
  |'WEB';

export interface Severity {
  score: string;
  type: SeverityType;
}

export type SeverityType = 'CVSS_V3';
