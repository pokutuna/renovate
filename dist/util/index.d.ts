import { RenovateConfig } from '../config/common';
export declare function setUtilConfig(config: Partial<RenovateConfig>): Promise<void>;
/**
 * Resolve path for a file relative to renovate root directory (our package.json)
 * @param file a file to resolve
 */
export declare function resolveFile(file: string): Promise<string>;
export declare function sampleSize(array: string[], n: number): string[];
