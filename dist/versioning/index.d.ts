import { VersioningApi, VersioningApiConstructor } from './common';
export * from './common';
export declare const getVersioningList: () => string[];
/**
 * Get versioning map. Can be used to dynamically add new versionig type
 */
export declare const getVersionings: () => Map<string, VersioningApi | VersioningApiConstructor>;
export declare function get(versioning: string): VersioningApi;
