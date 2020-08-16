import { RenovateConfig } from '../../../config';
import { PackageFile } from '../../../manager/common';
export declare function extractAllDependencies(config: RenovateConfig): Promise<Record<string, PackageFile[]>>;
