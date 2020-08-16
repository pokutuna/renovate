import { BranchUpgradeConfig } from '../../common';
import { ChangeLogResult } from './common';
export * from './common';
export declare function getChangeLogJSON(args: BranchUpgradeConfig): Promise<ChangeLogResult | null>;
