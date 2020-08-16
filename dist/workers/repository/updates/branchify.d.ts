import { RenovateConfig } from '../../../config';
import { BranchConfig } from '../../common';
import { Merge } from 'type-fest';
export declare type BranchifiedConfig = Merge<RenovateConfig, {
    branches: BranchConfig[];
    branchList: string[];
}>;
export declare function branchifyUpgrades(config: RenovateConfig, packageFiles: Record<string, any[]>): Promise<BranchifiedConfig>;
