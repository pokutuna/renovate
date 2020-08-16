import { UpdateDependencyConfig, Upgrade } from '../common';
export declare function updateAtPosition(fileContent: string, upgrade: Upgrade, endingAnchor: string): string | null;
export declare function updateDependency({ fileContent, upgrade, }: UpdateDependencyConfig): string | null;
