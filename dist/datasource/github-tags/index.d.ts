import { DigestConfig, GetReleasesConfig, ReleaseResult } from '../common';
export declare const id = "github-tags";
/**
 * github.getDigest
 *
 * The `newValue` supplied here should be a valid tag for the docker image.
 *
 * This function will simply return the latest commit hash for the configured repository.
 */
export declare function getDigest({ lookupName: githubRepo }: Partial<DigestConfig>, newValue?: string): Promise<string | null>;
/**
 * github.getReleases
 *
 * This function can be used to fetch releases with a customisable versioning (e.g. semver) and with either tags or releases.
 *
 * This function will:
 *  - Fetch all tags or releases (depending on configuration)
 *  - Sanitize the versions if desired (e.g. strip out leading 'v')
 *  - Return a dependency object containing sourceUrl string and releases array
 */
export declare function getReleases({ lookupName: repo, }: GetReleasesConfig): Promise<ReleaseResult | null>;
