import { RenovateConfig } from '../common';
export declare type Preset = RenovateConfig & Record<string, unknown>;
export declare type PresetConfig = {
    packageName: string;
    presetName?: string;
    baseConfig?: RenovateConfig;
};
export interface PresetApi {
    getPreset(config: PresetConfig): Promise<Preset> | Preset;
}
