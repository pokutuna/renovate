import { GetReleasesConfig, ReleaseResult } from '../common';
export declare const id = "crate";
export declare function getReleases({ lookupName, }: GetReleasesConfig): Promise<ReleaseResult | null>;
