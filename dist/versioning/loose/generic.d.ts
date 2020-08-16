import { NewValueConfig, VersioningApi } from '../common';
export interface GenericVersion {
    release: number[];
    /** prereleases are treated in the standard semver manner, if present */
    prerelease?: string;
    suffix?: string;
}
export interface VersionParser {
    (version: string): GenericVersion;
}
export interface VersionComparator {
    (version: string, other: string): number;
}
export declare const parser: (parse: VersionParser) => Partial<VersioningApi>;
export declare const comparer: (compare: VersionComparator) => Partial<VersioningApi>;
export declare const create: ({ parse, compare, }: {
    parse: VersionParser;
    compare: VersionComparator;
}) => any;
export declare abstract class GenericVersioningApi<T extends GenericVersion = GenericVersion> implements VersioningApi {
    private _getSection;
    protected abstract _compare(version: string, other: string): number;
    protected abstract _parse(version: string): T | null;
    isValid(version: string): boolean;
    isCompatible(version: string, _range: string): boolean;
    isStable(version: string): boolean;
    isSingleVersion(version: string): string | boolean;
    isVersion(version: string): string | boolean;
    getMajor(version: string): number | null;
    getMinor(version: string): number | null;
    getPatch(version: string): number | null;
    equals(version: string, other: string): boolean;
    isGreaterThan(version: string, other: string): boolean;
    isLessThanRange(version: string, range: string): boolean;
    maxSatisfyingVersion(versions: string[], range: string): string | null;
    minSatisfyingVersion(versions: string[], range: string): string | null;
    getNewValue(newValueConfig: NewValueConfig): string;
    sortVersions(version: string, other: string): number;
    matches(version: string, range: string): boolean;
}
