/// <reference types="node" />
import { RenovateConfig } from './common';
import { RenovateOptions } from './definitions';
export declare function getEnvName(option: Partial<RenovateOptions>): string;
export declare function getConfig(env: NodeJS.ProcessEnv): RenovateConfig;
