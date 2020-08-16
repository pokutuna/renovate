/// <reference types="node" />
import { RenovateConfig, RenovateConfigStage } from './common';
import { mergeChildConfig } from './utils';
export * from './common';
export { mergeChildConfig };
export interface ManagerConfig extends RenovateConfig {
    language: string;
    manager: string;
}
export declare function getManagerConfig(config: RenovateConfig, manager: string): ManagerConfig;
export declare function parseConfigs(env: NodeJS.ProcessEnv, argv: string[]): Promise<RenovateConfig>;
export declare function filterConfig(inputConfig: RenovateConfig, targetStage: RenovateConfigStage): RenovateConfig;
