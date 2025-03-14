/**
 * A schema for describing a vulnerability in an open source package.
 *
 * https://github.com/ossf/osv-schema/blob/main/validation/schema.json
 */
export interface Vulnerability {
  schema_version?: string;
  id: string;
  modified: string;
  published?: string;
  withdrawn?: string;
  aliases?: string[];
  related?: string[];
  summary?: string;
  details?: string;
  severity?: Severity[];
  affected?: Affected[];
  references?: Reference[];
  credits?: Credit[];
  database_specific?: Record<string, unknown>;
}

export interface Affected {
  package?: Package;
  severity?: Severity[];
  ranges?: Range[];
  versions?: string[];
  ecosystem_specific?: Record<string, unknown>;
  database_specific?: Record<string, unknown>;
}

export interface Severity {
  type: SeverityType;
  score: string;
}

export type SeverityType = 'CVSS_V4' | 'CVSS_V3' | 'CVSS_V2';

export interface Package {
  ecosystem: string;
  name: string;
  purl?: string;
}

export interface Range {
  type: RangeType;
  repo?: string;
  events: Event[];
  database_specific?: Record<string, unknown>;
}

export type RangeType = 'ECOSYSTEM' | 'GIT' | 'SEMVER';

export interface Event {
  introduced?: string;
  fixed?: string;
  last_affected?: string;
  limit?: string;
}

export interface Reference {
  type: ReferenceType;
  url: string;
}

export interface Credit {
  name: string;
  contact?: string[];
  type: CreditType;
}

export type ReferenceType =
  | 'ADVISORY'
  | 'ARTICLE'
  | 'DETECTION'
  | 'DISCUSSION'
  | 'REPORT'
  | 'FIX'
  | 'GIT'
  | 'INTRODUCED'
  | 'PACKAGE'
  | 'EVIDENCE'
  | 'WEB';

export type CreditType =
  | 'FINDER'
  | 'REPORTER'
  | 'ANALYST'
  | 'COORDINATOR'
  | 'REMEDIATION_DEVELOPER'
  | 'REMEDIATION_REVIEWER'
  | 'REMEDIATION_VERIFIER'
  | 'TOOL'
  | 'SPONSOR'
  | 'OTHER';
