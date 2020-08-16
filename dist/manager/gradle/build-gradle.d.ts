import { BuildDependency } from './gradle-updates-report';
export interface GradleDependency {
    group: string;
    name: string;
    version?: string;
}
export declare function collectVersionVariables(dependencies: BuildDependency[], buildGradleContent: string): void;
export declare function init(): void;
export declare function updateGradleVersion(buildGradleContent: string, dependency: GradleDependency, newVersion: string): string;
