import { ReleaseType } from 'semver';
import { UpdateDependencyConfig } from '../common';
export declare function bumpPackageVersion(content: string, currentValue: string, bumpVersion: ReleaseType | string): string;
export declare function updateDependency({ fileContent, upgrade, }: UpdateDependencyConfig): string | null;
