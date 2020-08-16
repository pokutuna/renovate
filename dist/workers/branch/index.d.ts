import { BranchConfig, ProcessBranchResult } from '../common';
export declare function processBranch(branchConfig: BranchConfig, prLimitReached?: boolean, commitLimitReached?: boolean): Promise<ProcessBranchResult>;
