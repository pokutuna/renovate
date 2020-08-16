import { DigestConfig, GetReleasesConfig, ReleaseResult } from '../common';
export declare const id = "go";
/**
 * go.getReleases
 *
 * This datasource resolves a go module URL into its source repository
 *  and then fetch it if it is on GitHub.
 *
 * This function will:
 *  - Determine the source URL for the module
 *  - Call the respective getReleases in github/gitlab to retrieve the tags
 *  - Filter module tags according to the module path
 */
export declare function getReleases({ lookupName, }: GetReleasesConfig): Promise<ReleaseResult | null>;
/**
 * go.getDigest
 *
 * This datasource resolves a go module URL into its source repository
 *  and then fetches the digest it if it is on GitHub.
 *
 * This function will:
 *  - Determine the source URL for the module
 *  - Call the respective getDigest in github to retrieve the commit hash
 */
export declare function getDigest({ lookupName }: Partial<DigestConfig>, value?: string): Promise<string | null>;
