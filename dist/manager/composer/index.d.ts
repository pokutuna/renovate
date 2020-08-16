import { updateArtifacts } from './artifacts';
import { extractPackageFile } from './extract';
import { getRangeStrategy } from './range';
declare const language = "php";
export declare const supportsLockFileMaintenance = true;
export { extractPackageFile, updateArtifacts, language, getRangeStrategy };
export declare const defaultConfig: {
    fileMatch: string[];
    versioning: string;
};
