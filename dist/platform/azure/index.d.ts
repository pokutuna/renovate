import { BranchStatus } from '../../types';
import { BranchStatusConfig, CreatePRConfig, EnsureCommentConfig, EnsureCommentRemovalConfig, EnsureIssueResult, FindPRConfig, Issue, PlatformParams, PlatformResult, Pr, RepoParams, RepoResult, VulnerabilityAlert } from '../common';
import { AzurePr } from './types';
export declare function initPlatform({ endpoint, token, username, password, }: PlatformParams): Promise<PlatformResult>;
export declare function getRepos(): Promise<string[]>;
export declare function initRepo({ repository, localDir, azureWorkItemId, optimizeForDisabled, }: RepoParams): Promise<RepoResult>;
export declare function getRepoForceRebase(): Promise<boolean>;
export declare function setBaseBranch(branchName: string): Promise<string>;
export declare function getPrList(): Promise<AzurePr[]>;
export declare function getPr(pullRequestId: number): Promise<Pr | null>;
export declare function findPr({ branchName, prTitle, state, }: FindPRConfig): Promise<Pr | null>;
export declare function getBranchPr(branchName: string): Promise<Pr | null>;
export declare function deleteBranch(branchName: string, abandonAssociatedPr?: boolean): Promise<void>;
export declare function getBranchStatusCheck(branchName: string, context: string): Promise<BranchStatus>;
export declare function getBranchStatus(branchName: string, requiredStatusChecks: string[]): Promise<BranchStatus>;
export declare function createPr({ branchName, targetBranch, prTitle: title, prBody: body, labels, draftPR, platformOptions, }: CreatePRConfig): Promise<Pr>;
export declare function updatePr(prNo: number, title: string, body?: string): Promise<void>;
export declare function ensureComment({ number, topic, content, }: EnsureCommentConfig): Promise<boolean>;
export declare function ensureCommentRemoval({ number: issueNo, topic, content, }: EnsureCommentRemovalConfig): Promise<void>;
export declare function setBranchStatus({ branchName, context, description, state, url: targetUrl, }: BranchStatusConfig): Promise<void>;
export declare function mergePr(pr: number, branchName: string): Promise<boolean>;
export declare function getPrBody(input: string): string;
export declare function findIssue(): Promise<Issue | null>;
export declare function ensureIssue(): Promise<EnsureIssueResult | null>;
export declare function ensureIssueClosing(): Promise<void>;
export declare function getIssueList(): Promise<Issue[]>;
/**
 *
 * @param {number} issueNo
 * @param {string[]} assignees
 */
export declare function addAssignees(issueNo: number, assignees: string[]): Promise<void>;
/**
 *
 * @param {number} prNo
 * @param {string[]} reviewers
 */
export declare function addReviewers(prNo: number, reviewers: string[]): Promise<void>;
export declare function deleteLabel(prNumber: number, label: string): Promise<void>;
export declare function getVulnerabilityAlerts(): Promise<VulnerabilityAlert[]>;
