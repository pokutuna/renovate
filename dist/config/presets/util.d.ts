import { Preset } from './common';
export declare const PRESET_DEP_NOT_FOUND = "dep not found";
export declare const PRESET_NOT_FOUND = "preset not found";
export declare type PresetFetcher = (repo: string, fileName: string, endpoint: string) => Promise<Preset>;
export declare type FetchPresetConfig = {
    pkgName: string;
    filePreset: string;
    endpoint: string;
    fetch: PresetFetcher;
};
export declare function fetchPreset({ pkgName, filePreset, endpoint, fetch, }: FetchPresetConfig): Promise<Preset | undefined>;
