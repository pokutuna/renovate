import { Release } from '../../../../datasource';
export interface FilterConfig {
    allowedVersions?: string;
    depName?: string;
    followTag?: string;
    ignoreDeprecated?: boolean;
    ignoreUnstable?: boolean;
    respectLatest?: boolean;
    versioning: string;
}
export declare function filterVersions(config: FilterConfig, fromVersion: string, latestVersion: string, versions: string[], releases: Release[]): string[];
