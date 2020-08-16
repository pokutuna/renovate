import { GetReleasesConfig, ReleaseResult } from '../common';
export declare const id = "pypi";
export declare const defaultRegistryUrls: string[];
export declare const registryStrategy = "merge";
export declare function getReleases({ compatibility, lookupName, registryUrl, }: GetReleasesConfig): Promise<ReleaseResult | null>;
