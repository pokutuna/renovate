import { Pr } from '../common';
export declare type CombinedBranchState = 'failure' | 'pending' | 'success';
export declare type BranchState = 'failure' | 'pending' | 'success' | 'error';
export interface GhBranchStatus {
    context: string;
    state: BranchState;
}
export interface CombinedBranchStatus {
    state: CombinedBranchState;
    statuses: GhBranchStatus[];
}
export interface Comment {
    id: number;
    body: string;
}
export interface GhPr extends Pr {
    comments: Comment[];
}
export interface LocalRepoConfig {
    repositoryName: string;
    pushProtection: boolean;
    prReviewsRequired: boolean;
    repoForceRebase?: boolean;
    parentRepo: string;
    forkMode?: boolean;
    forkToken?: string;
    closedPrList: PrList | null;
    openPrList: PrList | null;
    prList: GhPr[] | null;
    issueList: any[] | null;
    mergeMethod: string;
    defaultBranch: string;
    defaultBranchSha?: string;
    repositoryOwner: string;
    repository: string | null;
    localDir: string;
    isGhe: boolean;
    renovateUsername: string;
    productLinks: any;
}
export declare type BranchProtection = any;
export declare type PrList = Record<number, GhPr>;
export interface GhRepo {
    isFork: boolean;
    isArchived: boolean;
    nameWithOwner: string;
    mergeCommitAllowed: boolean;
    rebaseMergeAllowed: boolean;
    squashMergeAllowed: boolean;
    defaultBranchRef: {
        name: string;
        target: {
            oid: string;
        };
    };
}
