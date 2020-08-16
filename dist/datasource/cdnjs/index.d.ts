import { GetReleasesConfig, ReleaseResult } from '../common';
export declare const id = "cdnjs";
export declare function getReleases({ lookupName, }: GetReleasesConfig): Promise<ReleaseResult | null>;
