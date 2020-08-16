import { GetReleasesConfig, ReleaseResult } from '../common';
export declare const id = "gradle-version";
export declare const defaultRegistryUrls: string[];
export declare const registryStrategy = "merge";
export declare function getReleases({ registryUrl, }: GetReleasesConfig): Promise<ReleaseResult>;
