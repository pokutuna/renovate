import { RenovateConfig } from '../../../../config';
import { PackageFile } from '../../../../manager/common';
export declare function getWarnings(config: RenovateConfig): string;
export declare function getErrors(config: RenovateConfig): string;
export declare function getDepWarnings(packageFiles: Record<string, PackageFile[]>): string;
