import { GetReleasesConfig, ReleaseResult } from '../common';
export declare const id = "orb";
/**
 * orb.getReleases
 *
 * This function will fetch an orb from CircleCI and return all semver versions.
 */
export declare function getReleases({ lookupName, }: GetReleasesConfig): Promise<ReleaseResult | null>;
