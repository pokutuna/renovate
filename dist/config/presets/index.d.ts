import { RenovateConfig } from '../common';
export declare function replaceArgs(obj: string | string[] | Record<string, any> | Record<string, any>[], argMapping: Record<string, any>): any;
export declare function parsePreset(input: string): ParsedPreset;
export declare function getPreset(preset: string, baseConfig?: RenovateConfig): Promise<RenovateConfig>;
export declare function resolveConfigPresets(inputConfig: RenovateConfig, baseConfig?: RenovateConfig, ignorePresets?: string[], existingPresets?: string[]): Promise<RenovateConfig>;
export interface ParsedPreset {
    presetSource: string;
    packageName: string;
    presetName: string;
    params?: string[];
}
