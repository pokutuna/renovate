import { Preset, PresetConfig } from '../common';
export declare const Endpoint = "https://gitlab.com/api/v4/";
export declare function fetchJSONFile(repo: string, fileName: string, endpoint: string): Promise<Preset>;
export declare function getPresetFromEndpoint(pkgName: string, presetName: string, endpoint?: string): Promise<Preset>;
export declare function getPreset({ packageName: pkgName, presetName, }: PresetConfig): Promise<Preset>;
