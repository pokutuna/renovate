import { Release } from '../../../datasource';
import { BranchUpgradeConfig } from '../../common';
export declare function getInRangeReleases(config: BranchUpgradeConfig): Promise<Release[] | null>;
