/// <reference types="node" />
import { PostUpdateConfig, Upgrade } from '../../common';
export interface GenerateLockFileResult {
    error?: boolean;
    lockFile?: string;
    stderr?: string;
}
export declare function generateLockFile(cwd: string, env: NodeJS.ProcessEnv, filename: string, config?: PostUpdateConfig, upgrades?: Upgrade[]): Promise<GenerateLockFileResult>;
