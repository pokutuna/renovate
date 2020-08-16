import { ExtractConfig, PackageFile } from '../../common';
export declare function extractPackageFile(content: string, fileName: string, config: ExtractConfig): Promise<PackageFile | null>;
export declare function postExtract(packageFiles: PackageFile[]): Promise<void>;
export declare function extractAllPackageFiles(config: ExtractConfig, packageFiles: string[]): Promise<PackageFile[]>;
