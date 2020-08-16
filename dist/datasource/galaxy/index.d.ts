import { GetReleasesConfig, ReleaseResult } from '../common';
export declare const id = "galaxy";
export declare function getReleases({ lookupName, }: GetReleasesConfig): Promise<ReleaseResult | null>;
