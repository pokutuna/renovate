/// <reference types="node" />
import { PostUpdateConfig, Upgrade } from '../../common';
export interface GenerateLockFileResult {
    error?: boolean;
    lockFile?: string;
    stderr?: string;
    stdout?: string;
}
export declare function generateLockFile(cwd: string, env: NodeJS.ProcessEnv, config: PostUpdateConfig, upgrades?: Upgrade[]): Promise<GenerateLockFileResult>;
