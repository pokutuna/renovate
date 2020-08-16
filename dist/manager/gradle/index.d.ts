/// <reference types="node" />
import { Stats } from 'fs';
import { ExtractConfig, PackageFile, UpdateDependencyConfig } from '../common';
export declare const GRADLE_DEPENDENCY_REPORT_OPTIONS = "--init-script renovate-plugin.gradle renovate";
export declare function executeGradle(config: ExtractConfig, cwd: string, gradlew: Stats | null): Promise<void>;
export declare function extractAllPackageFiles(config: ExtractConfig, packageFiles: string[]): Promise<PackageFile[] | null>;
export declare function updateDependency({ fileContent, upgrade, }: UpdateDependencyConfig): string;
export declare const language = "java";
export declare const defaultConfig: {
    fileMatch: string[];
    timeout: number;
    versioning: string;
};
