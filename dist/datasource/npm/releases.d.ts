import { GetReleasesConfig, ReleaseResult } from '../common';
export declare function getReleases({ lookupName, npmrc, }: GetReleasesConfig): Promise<ReleaseResult | null>;
