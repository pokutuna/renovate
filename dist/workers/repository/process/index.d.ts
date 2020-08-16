import { RenovateConfig } from '../../../config';
import { BranchConfig } from '../../common';
import { ExtractResult } from './extract-update';
import { WriteUpdateResult } from './write';
export declare function extractDependencies(config: RenovateConfig): Promise<ExtractResult>;
export declare function updateRepo(config: RenovateConfig, branches: BranchConfig[], branchList: string[]): Promise<WriteUpdateResult | undefined>;
