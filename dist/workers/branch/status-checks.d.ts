import { RenovateConfig } from '../../config';
import { BranchStatus } from '../../types';
export declare type StabilityConfig = RenovateConfig & {
    stabilityStatus?: BranchStatus;
    branchName: string;
};
export declare function setStability(config: StabilityConfig): Promise<void>;
export declare type UnpublishableConfig = RenovateConfig & {
    unpublishSafe?: boolean;
    canBeUnpublished?: boolean;
    branchName: string;
};
export declare function setUnpublishable(config: UnpublishableConfig): Promise<void>;
