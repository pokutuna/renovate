import { BranchUpgradeConfig } from '../../common';
import { ChangeLogResult } from './common';
export declare function getChangeLogJSON({ versioning, fromVersion, toVersion, sourceUrl, releases, depName, manager, }: BranchUpgradeConfig): Promise<ChangeLogResult | null>;
