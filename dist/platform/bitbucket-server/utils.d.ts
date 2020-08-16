import { BbbsRestPr, BbsPr } from './types';
export declare function prInfo(pr: BbbsRestPr): BbsPr;
export declare function accumulateValues<T = any>(reqUrl: string, method?: string, options?: any, limit?: number): Promise<T[]>;
export interface BitbucketCommitStatus {
    failed: number;
    inProgress: number;
    successful: number;
}
export declare type BitbucketBranchState = 'SUCCESSFUL' | 'FAILED' | 'INPROGRESS' | 'STOPPED';
export interface BitbucketStatus {
    key: string;
    state: BitbucketBranchState;
}
