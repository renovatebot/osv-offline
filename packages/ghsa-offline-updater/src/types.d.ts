/**
 * The first version containing a fix for the vulnerability.
 */
export type FirstPatchedVersion = {
  /**
   * The package name or version.
   */
  Identifier: string;
};

/**
 * A GitHub Security Advisory Reference.
 */
export type Reference = {
  /**
   * A publicly accessible reference.
   */
  Url: string;
};

export type Version = {
  /**
   * The first version containing a fix for the vulnerability.
   */
  FirstPatchedVersion: FirstPatchedVersion;
  /**
   * A string that describes the vulnerable package versions
   */
  VulnerableVersionRange: string;
};

/**
 * An individual package.
 */
export type Package = {
  /**
   * The ecosystem the package belongs to, e.g. RUBYGEMS, NPM.
   */
  Ecosystem: 'COMPOSER' | 'MAVEN' | 'NPM' | 'NUGET' | 'PIP' | 'RUBYGEMS';

  /**
   * The package name.
   */
  Name: string;
};

/**
 * A GitHub Security Advisory Identifier.
 */
export type Identifier = {
  /**
   * The identifier type, e.g. GHSA, CVE.
   */
  Type: 'GHSA' | 'CVE';
  /**
   * The identifier.
   */
  Value: string;
};

export type GhsaAdvisory = {
  /**
   * Identifies the primary key from the database.
   */
  DatabaseId: number;

  Id: string;
  /**
   * The GitHub Security Advisory ID.
   */
  GhsaId: string;
  /**
   * A list of references for this advisory.
   */
  References: Reference[];
  /**
   * A list of identifiers for this advisory.
   */
  Identifiers: Identifier[];
  /**
   * This is a long plaintext description of the advisory.
   */
  Description: string;
  /**
   * The organization that originated the advisory.
   */
  Origin: string;
  /**
   * When the advisory was published.
   */
  PublishedAt: Date;
  /**
   * The severity of the advisory.
   */
  Severity: string;
  /**
   * A short plaintext summary of the advisory.
   */
  Summary: string;
  /**
   * When the advisory was last updated.
   */
  UpdatedAt: string;
  /**
   * When the advisory was withdrawn, if it has been withdrawn.
   */
  WithdrawnAt: Date;
};

export type GithubSecurityAdvisory = {
  Severity: string;
  UpdatedAt: string;
  Package: Package;
  Advisory: GhsaAdvisory;
  Versions: Version[];
};
