import { RenovateOptions } from './definitions';
export declare function getCliName(option: Partial<RenovateOptions>): string;
export interface RenovateCliConfig extends Record<string, any> {
    repositories?: string[];
}
export declare function getConfig(input: string[]): RenovateCliConfig;
