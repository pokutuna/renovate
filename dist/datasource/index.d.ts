import { Datasource, DigestConfig, GetPkgReleasesConfig, ReleaseResult } from './common';
export * from './common';
export declare const getDatasources: () => Map<string, Datasource>;
export declare const getDatasourceList: () => string[];
export declare function getPkgReleases(config: GetPkgReleasesConfig): Promise<ReleaseResult | null>;
export declare function supportsDigests(config: DigestConfig): boolean;
export declare function getDigest(config: DigestConfig, value?: string): Promise<string | null>;
export declare function getDefaultConfig(datasource: string): Promise<object>;
