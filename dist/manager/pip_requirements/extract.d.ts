import { ExtractConfig, PackageFile } from '../common';
export declare const packagePattern = "[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]";
export declare const dependencyPattern: string;
export declare function extractPackageFile(content: string, _: string, config: ExtractConfig): PackageFile | null;
