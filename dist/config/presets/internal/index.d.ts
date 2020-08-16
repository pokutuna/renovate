import { Preset, PresetConfig } from '../common';
export declare const groups: Record<string, Record<string, Preset>>;
export declare function getPreset({ packageName: pkgName, presetName, }: PresetConfig): Preset | undefined;
