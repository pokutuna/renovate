export declare const GRADLE_DEPENDENCY_REPORT_FILENAME = "gradle-renovate-report.json";
export interface BuildDependency {
    name: string;
    depGroup: string;
    depName?: string;
    currentValue?: string;
    registryUrls?: string[];
}
export declare function createRenovateGradlePlugin(localDir: string): Promise<void>;
export declare function extractDependenciesFromUpdatesReport(localDir: string): Promise<BuildDependency[]>;
