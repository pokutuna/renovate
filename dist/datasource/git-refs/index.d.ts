import { DigestConfig, GetReleasesConfig, ReleaseResult } from '../common';
export declare const id = "git-refs";
export interface RawRefs {
    type: string;
    value: string;
    hash: string;
}
export declare function getRawRefs({ lookupName, }: GetReleasesConfig): Promise<RawRefs[] | null>;
export declare function getReleases({ lookupName, }: GetReleasesConfig): Promise<ReleaseResult | null>;
export declare function getDigest({ lookupName }: Partial<DigestConfig>, newValue?: string): Promise<string | null>;
