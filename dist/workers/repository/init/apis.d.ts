import { RenovateConfig } from '../../../config';
import { RepoResult } from '../../../platform';
export declare type WorkerPlatformConfig = RepoResult & RenovateConfig & Record<string, any>;
export declare function initApis(input: RenovateConfig): Promise<WorkerPlatformConfig>;
