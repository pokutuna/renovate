import { PackageDependency, PackageFile } from '../common';
export declare function trimAtKey(str: string, kwName: string): string | null;
export declare function expandDepName(name: string): string;
export interface ExtractContext {
    depType?: string;
    registryUrls?: string[];
}
export declare function extractFromVectors(str: string, offset?: number, ctx?: ExtractContext): PackageDependency[];
export declare function extractPackageFile(content: string): PackageFile;
