export { extractAllPackageFiles } from './extract';
export { updateDependency } from './update';
export { getRangeStrategy } from './range';
export declare const language = "js";
export declare const supportsLockFileMaintenance = true;
export declare const defaultConfig: {
    fileMatch: string[];
    rollbackPrs: boolean;
    versioning: string;
    prBodyDefinitions: {
        Change: string;
    };
};
