import { updateArtifacts } from './artifacts';
import { extractPackageFile } from './extract';
declare const language = "rust";
export declare const supportsLockFileMaintenance = false;
export { extractPackageFile, updateArtifacts, language };
export declare const defaultConfig: {
    commitMessageTopic: string;
    managerBranchPrefix: string;
    fileMatch: string[];
    versioning: string;
    rangeStrategy: string;
};
