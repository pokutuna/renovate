import { RenovateConfig } from '../../../config';
import { BranchConfig } from '../../common';
export declare function getPrHourlyRemaining(config: RenovateConfig): Promise<number>;
export declare function getConcurrentPrsRemaining(config: RenovateConfig, branches: BranchConfig[]): Promise<number>;
export declare function getPrsRemaining(config: RenovateConfig, branches: BranchConfig[]): Promise<number>;
