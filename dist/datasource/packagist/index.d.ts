import { GetReleasesConfig, ReleaseResult } from '../common';
export declare const id = "packagist";
export declare const defaultRegistryUrls: string[];
export declare const registryStrategy = "hunt";
export declare function getReleases({ lookupName, registryUrl, }: GetReleasesConfig): Promise<ReleaseResult>;
