import { GetReleasesConfig, ReleaseResult } from '../common';
export declare function getJenkinsPluginDependency(lookupName: string): Promise<ReleaseResult | null>;
export declare function getReleases({ lookupName, }: GetReleasesConfig): Promise<ReleaseResult | null>;
export declare function resetCache(): void;
