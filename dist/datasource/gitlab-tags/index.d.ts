import { GetReleasesConfig, ReleaseResult } from '../common';
export declare const id = "gitlab-tags";
export declare const defaultRegistryUrls: string[];
export declare const registryStrategy = "first";
export declare function getReleases({ registryUrl: depHost, lookupName: repo, }: GetReleasesConfig): Promise<ReleaseResult | null>;
