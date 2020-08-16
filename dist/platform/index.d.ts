import { RenovateConfig } from '../config/common';
import { Platform } from './common';
export * from './common';
export declare const getPlatformList: () => string[];
export declare const getPlatforms: () => Map<string, Platform>;
export declare const platform: Platform;
export declare function setPlatformApi(name: string): void;
interface GitAuthor {
    name?: string;
    address?: string;
}
export declare function parseGitAuthor(input: string): GitAuthor | null;
export declare function initPlatform(config: RenovateConfig): Promise<RenovateConfig>;
