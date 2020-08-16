import { CustomExtractConfig, PackageFile, Result } from '../common';
export declare const defaultConfig: {
    pinDigests: boolean;
};
export declare function extractPackageFile(content: string, packageFile: string, config: CustomExtractConfig): Result<PackageFile | null>;
