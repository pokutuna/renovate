import { ExtractConfig, PackageFile } from '../common';
import { PythonSetup } from './util';
export declare const pythonVersions: string[];
export declare function resetModule(): void;
export declare function parsePythonVersion(str: string): number[];
export declare function getPythonAlias(): Promise<string>;
export declare function extractSetupFile(_content: string, packageFile: string, config: ExtractConfig): Promise<PythonSetup>;
export declare function extractPackageFile(content: string, packageFile: string, config: ExtractConfig): Promise<PackageFile | null>;
