import { GetReleasesConfig, ReleaseResult } from '../common';
export declare const id = "dart";
export declare function getReleases({ lookupName, }: GetReleasesConfig): Promise<ReleaseResult | null>;
