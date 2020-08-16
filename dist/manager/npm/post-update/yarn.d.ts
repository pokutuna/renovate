/// <reference types="node" />
import { PostUpdateConfig, Upgrade } from '../../common';
export interface GenerateLockFileResult {
    error?: boolean;
    lockFile?: string;
    stderr?: string;
}
export declare function hasYarnOfflineMirror(cwd: string): Promise<boolean>;
export declare const optimizeCommand = "sed -i 's/ steps,/ steps.slice(0,1),/' /home/ubuntu/.npm-global/lib/node_modules/yarn/lib/cli.js";
export declare function generateLockFile(cwd: string, env: NodeJS.ProcessEnv, config?: PostUpdateConfig, upgrades?: Upgrade[]): Promise<GenerateLockFileResult>;
