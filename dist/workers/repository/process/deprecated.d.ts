import { RenovateConfig } from '../../../config';
import { PackageFile } from '../../../manager/common';
export declare function raiseDeprecationWarnings(config: RenovateConfig, packageFiles: Record<string, PackageFile[]>): Promise<void>;
