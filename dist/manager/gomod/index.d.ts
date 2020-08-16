import { updateArtifacts } from './artifacts';
import { extractPackageFile } from './extract';
import { updateDependency } from './update';
export declare const language = "golang";
export { extractPackageFile, updateDependency, updateArtifacts };
export declare const defaultConfig: {
    fileMatch: string[];
};
