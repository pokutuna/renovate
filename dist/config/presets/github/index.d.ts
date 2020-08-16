import { Preset, PresetConfig } from '../common';
export declare const Endpoint = "https://api.github.com/";
export declare function fetchJSONFile(repo: string, fileName: string, endpoint: string): Promise<Preset>;
export declare function getPresetFromEndpoint(pkgName: string, filePreset: string, endpoint?: string): Promise<Preset>;
export declare function getPreset({ packageName: pkgName, presetName, }: PresetConfig): Promise<Preset>;
