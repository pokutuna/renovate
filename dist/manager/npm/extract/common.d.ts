import { PackageJson } from 'type-fest';
export declare type NpmPackageDependeny = PackageJson.Dependency;
export interface NpmPackage extends PackageJson {
    renovate?: unknown;
    _from?: any;
    _args?: any;
    _id?: any;
}
export declare type LockFileEntry = Record<string, {
    version: string;
    integrity?: boolean;
}>;
