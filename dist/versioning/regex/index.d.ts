import { VersioningApiConstructor } from '../common';
import { GenericVersion, GenericVersioningApi } from '../loose/generic';
export declare const id = "regex";
export declare const displayName = "Regular Expression";
export declare const urls: any[];
export declare const supportsRanges = false;
export interface RegExpVersion extends GenericVersion {
    /** prereleases are treated in the standard semver manner, if present */
    prerelease: string;
    /**
     * compatibility, if present, are treated as a compatibility layer: we will
     * never try to update to a version with a different compatibility.
     */
    compatibility: string;
}
export declare class RegExpVersioningApi extends GenericVersioningApi<RegExpVersion> {
    private _config;
    constructor(new_config: string);
    protected _compare(version: string, other: string): number;
    protected _parse(version: string): RegExpVersion | null;
    isCompatible(version: string, range: string): boolean;
    isStable(version: string): boolean;
    isLessThanRange(version: string, range: string): boolean;
    maxSatisfyingVersion(versions: string[], range: string): string | null;
    minSatisfyingVersion(versions: string[], range: string): string | null;
    matches(version: string, range: string): boolean;
}
export declare const api: VersioningApiConstructor;
export default api;
