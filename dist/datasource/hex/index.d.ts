import { GetReleasesConfig, ReleaseResult } from '../common';
export declare const id = "hex";
export declare function getReleases({ lookupName, }: GetReleasesConfig): Promise<ReleaseResult | null>;
