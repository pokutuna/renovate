import { DigestConfig, GetReleasesConfig, ReleaseResult } from '../common';
export declare const id = "git-submodules";
export declare const defaultConfig: {
    pinDigests: boolean;
};
export declare function getReleases({ lookupName, registryUrls, }: GetReleasesConfig): Promise<ReleaseResult | null>;
export declare const getDigest: (config: DigestConfig, newValue?: string) => Promise<string>;
