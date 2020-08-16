/// <reference types="node" />
import { ExecOptions as ChildProcessExecOptions } from 'child_process';
import { RenovateConfig } from '../../config/common';
import { DockerOptions, ExecResult, Opt } from './common';
export declare function setExecConfig(config: Partial<RenovateConfig>): Promise<void>;
declare type ExtraEnv<T = unknown> = Record<string, T>;
export interface ExecOptions extends ChildProcessExecOptions {
    cwdFile?: string;
    extraEnv?: Opt<ExtraEnv>;
    docker?: Opt<DockerOptions>;
}
export declare function exec(cmd: string | string[], opts?: ExecOptions): Promise<ExecResult>;
export {};
