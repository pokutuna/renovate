import { RenovateConfig } from '../../../../config';
import { PackageFile } from '../../../../manager/common';
export declare function getScheduleDesc(config: RenovateConfig): string[];
export declare function getConfigDesc(config: RenovateConfig, packageFiles?: Record<string, PackageFile[]>): string;
