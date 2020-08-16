import { RenovateConfig } from '../../../../config';
import { PackageFile } from '../../../../manager/common';
import { BranchConfig } from '../../../common';
export declare function ensureOnboardingPr(config: RenovateConfig, packageFiles: Record<string, PackageFile[]> | null, branches: BranchConfig[]): Promise<void>;
