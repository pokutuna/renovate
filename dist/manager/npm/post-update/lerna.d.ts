/// <reference types="node" />
import { PackageFile, PostUpdateConfig } from '../../common';
export interface GenerateLockFileResult {
    error?: boolean;
    stderr?: string;
}
export declare function getLernaVersion(lernaPackageFile: Partial<PackageFile>): string;
export declare function generateLockFiles(lernaPackageFile: Partial<PackageFile>, cwd: string, config: PostUpdateConfig, env: NodeJS.ProcessEnv, skipInstalls?: boolean): Promise<GenerateLockFileResult>;
