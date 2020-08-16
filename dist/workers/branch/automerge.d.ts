import { RenovateConfig } from '../../config';
export declare type AutomergeResult = 'automerged' | 'automerge aborted - PR exists' | 'branch status error' | 'failed' | 'no automerge' | 'not ready';
export declare function tryBranchAutomerge(config: RenovateConfig): Promise<AutomergeResult>;
