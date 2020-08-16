import { UpdateArtifact, UpdateArtifactsResult } from '../common';
export declare function updateArtifacts({ packageFileName: goModFileName, updatedDeps: _updatedDeps, newPackageFileContent: newGoModContent, config, }: UpdateArtifact): Promise<UpdateArtifactsResult[] | null>;
