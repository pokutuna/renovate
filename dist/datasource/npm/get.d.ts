import { Release, ReleaseResult } from '../common';
export declare function resetMemCache(): void;
export declare function resetCache(): void;
export interface NpmRelease extends Release {
    canBeUnpublished?: boolean;
    gitRef?: string;
}
export interface NpmDependency extends ReleaseResult {
    releases: NpmRelease[];
    deprecationSource?: string;
    name: string;
    homepage: string;
    latestVersion: string;
    sourceUrl: string;
    versions: Record<string, any>;
    'dist-tags': Record<string, string>;
    'renovate-config': any;
    sourceDirectory?: string;
}
export declare function getDependency(packageName: string, retries?: number): Promise<NpmDependency | null>;
