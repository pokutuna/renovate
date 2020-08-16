import { BranchStatus } from '../../types';
import { Pr } from '../common';
export interface Config {
    defaultBranch: string;
    has_issues: boolean;
    mergeMethod: string;
    owner: string;
    prList: Pr[];
    repository: string;
    bbUseDefaultReviewers: boolean;
    username: string;
}
export interface PagedResult<T = any> {
    pagelen: number;
    size?: number;
    next?: string;
    values: T[];
}
export interface RepoInfo {
    isFork: boolean;
    owner: string;
    mainbranch: string;
    mergeMethod: string;
    has_issues: boolean;
}
export declare type BitbucketBranchState = 'SUCCESSFUL' | 'FAILED' | 'INPROGRESS';
export interface BitbucketStatus {
    key: string;
    state: BitbucketBranchState;
}
export declare function repoInfoTransformer(repoInfoBody: any): RepoInfo;
export declare const prStates: {
    open: string[];
    notOpen: string[];
    merged: string[];
    closed: string[];
    all: string[];
};
export declare const buildStates: Record<BranchStatus, BitbucketBranchState>;
export declare function accumulateValues<T = any>(reqUrl: string, method?: string, options?: any, pagelen?: number): Promise<T[]>;
export declare function isConflicted(files: any): boolean;
export declare function prInfo(pr: any): Pr;
