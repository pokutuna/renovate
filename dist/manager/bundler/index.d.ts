import { updateArtifacts } from './artifacts';
import { extractPackageFile } from './extract';
import { getRangeStrategy } from './range';
declare const language = "ruby";
export declare const supportsLockFileMaintenance = true;
export { extractPackageFile, // Mandatory unless extractAllPackageFiles is used instead
updateArtifacts, // Optional
getRangeStrategy, // Optional
language, };
export declare const defaultConfig: {
    fileMatch: string[];
    versioning: string;
};
