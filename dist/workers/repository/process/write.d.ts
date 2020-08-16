import { RenovateConfig } from '../../../config';
import { BranchConfig } from '../../common';
export declare type WriteUpdateResult = 'done' | 'automerged';
export declare function writeUpdates(config: RenovateConfig, allBranches: BranchConfig[]): Promise<WriteUpdateResult>;
