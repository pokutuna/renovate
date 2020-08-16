import { UpdateArtifact, UpdateArtifactsResult } from '../common';
export declare function updateArtifacts({ packageFileName, newPackageFileContent, updatedDeps, config, }: UpdateArtifact): Promise<UpdateArtifactsResult[] | null>;
