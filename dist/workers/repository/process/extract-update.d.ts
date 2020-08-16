import { RenovateConfig } from '../../../config';
import { PackageFile } from '../../../manager/common';
import { BranchConfig } from '../../common';
import { WriteUpdateResult } from './write';
export declare type ExtractResult = {
    branches: BranchConfig[];
    branchList: string[];
    packageFiles: Record<string, PackageFile[]>;
};
export declare function extract(config: RenovateConfig): Promise<Record<string, PackageFile[]>>;
export declare function lookup(config: RenovateConfig, packageFiles: Record<string, PackageFile[]>): Promise<ExtractResult>;
export declare function update(config: RenovateConfig, branches: BranchConfig[]): Promise<WriteUpdateResult | undefined>;
