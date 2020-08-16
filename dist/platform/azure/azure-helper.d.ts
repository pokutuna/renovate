import { GitCommit, GitPullRequest, GitPullRequestMergeStrategy, GitRef } from 'azure-devops-node-api/interfaces/GitInterfaces';
import { Options } from 'simple-git';
import { HostRule } from '../../types';
import { AzurePr } from './types';
export declare function getStorageExtraCloneOpts(config: HostRule): Options;
export declare function getNewBranchName(branchName?: string): string;
export declare function getBranchNameWithoutRefsheadsPrefix(branchPath: string): string | undefined;
export declare function getRefs(repoId: string, branchName?: string): Promise<GitRef[]>;
export interface AzureBranchObj {
    name: string;
    oldObjectId: string;
}
export declare function getAzureBranchObj(repoId: string, branchName: string, from?: string): Promise<AzureBranchObj>;
export declare function getFile(repoId: string, filePath: string, branchName: string): Promise<string | null>;
export declare function max4000Chars(str: string): string;
export declare function getRenovatePRFormat(azurePr: GitPullRequest): AzurePr;
export declare function getCommitDetails(commit: string, repoId: string): Promise<GitCommit>;
export declare function getProjectAndRepo(str: string): {
    project: string;
    repo: string;
};
export declare function getMergeMethod(repoId: string, project: string): Promise<GitPullRequestMergeStrategy>;
