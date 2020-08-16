/// <reference types="node" />
import { ExecOptions as ChildProcessExecOptions } from 'child_process';
export declare type Opt<T> = T | null | undefined;
export declare enum BinarySource {
    Auto = "auto",
    Docker = "docker",
    Global = "global"
}
export interface ExecConfig {
    binarySource: Opt<BinarySource>;
    dockerUser: Opt<string>;
    localDir: Opt<string>;
    cacheDir: Opt<string>;
}
export declare type VolumesPair = [string, string];
export declare type VolumeOption = Opt<string | VolumesPair>;
export declare type DockerExtraCommand = Opt<string>;
export declare type DockerExtraCommands = Opt<DockerExtraCommand[]>;
export interface DockerOptions {
    image: string;
    tag?: Opt<string>;
    tagScheme?: Opt<string>;
    tagConstraint?: Opt<string>;
    volumes?: Opt<VolumeOption[]>;
    envVars?: Opt<Opt<string>[]>;
    cwd?: Opt<string>;
    preCommands?: DockerExtraCommands;
    postCommands?: DockerExtraCommands;
}
export interface RawExecOptions extends ChildProcessExecOptions {
    encoding: string;
}
export interface ExecResult {
    stdout: string;
    stderr: string;
}
export declare const rawExec: (cmd: string, opts: RawExecOptions) => Promise<ExecResult>;
