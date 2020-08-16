import { DigestConfig, GetReleasesConfig, ReleaseResult } from '../common';
export declare const id = "git-tags";
export declare function getReleases({ lookupName, }: GetReleasesConfig): Promise<ReleaseResult | null>;
export declare function getDigest({ lookupName }: Partial<DigestConfig>, newValue?: string): Promise<string | null>;
