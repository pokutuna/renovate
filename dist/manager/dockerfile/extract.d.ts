import { PackageDependency, PackageFile } from '../common';
export declare function splitImageParts(currentFrom: string): PackageDependency;
export declare function getDep(currentFrom: string, specifyReplaceString?: boolean): PackageDependency;
export declare function extractPackageFile(content: string): PackageFile | null;
