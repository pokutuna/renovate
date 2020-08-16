import { RenovateConfig } from '../../config/common';
import { Pr } from '../../platform';
import { BranchConfig, PrResult } from '../common';
export declare function addAssigneesReviewers(config: RenovateConfig, pr: Pr): Promise<void>;
export declare function ensurePr(prConfig: BranchConfig): Promise<{
    prResult: PrResult;
    pr?: Pr;
}>;
export declare function checkAutoMerge(pr: Pr, config: BranchConfig): Promise<boolean>;
