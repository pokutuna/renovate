import { RenovateConfig } from '../../../config/common';
import { PackageFile } from '../../../manager/common';
export interface BaseBranchCache {
    sha: string;
    configHash: string;
    packageFiles: PackageFile[];
}
export interface Cache {
    repository?: string;
    init?: {
        configFile: string;
        contents: RenovateConfig;
    };
    scan?: Record<string, BaseBranchCache>;
}
export declare function getCacheFileName(config: RenovateConfig): string;
export declare function initialize(config: RenovateConfig): Promise<void>;
export declare function getCache(): Cache;
export declare function finalize(): Promise<void>;
