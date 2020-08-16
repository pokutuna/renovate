import { GetReleasesConfig, ReleaseResult } from '../common';
export { id } from './common';
export declare const defaultRegistryUrls: string[];
export declare const registryStrategy = "merge";
export declare function getReleases({ lookupName, registryUrl, }: GetReleasesConfig): Promise<ReleaseResult>;
