import { GetReleasesConfig, ReleaseResult } from '../common';
export declare function getReleases({ lookupName, registryUrl, }: GetReleasesConfig): Promise<ReleaseResult | null>;
