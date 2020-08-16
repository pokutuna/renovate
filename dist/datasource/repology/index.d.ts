import { GetReleasesConfig, ReleaseResult } from '../common';
export declare const id = "repology";
export declare type RepologyPackageType = 'binname' | 'srcname';
export interface RepologyPackage {
    repo: string;
    visiblename: string;
    version: string;
    srcname?: string;
    binname?: string;
    origversion?: string;
}
export declare function getReleases({ lookupName, }: GetReleasesConfig): Promise<ReleaseResult | null>;
