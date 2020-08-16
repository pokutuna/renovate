import { UpdateArtifact, UpdateArtifactsResult } from '../common';
export declare function updateArtifacts({ packageFileName, updatedDeps, newPackageFileContent, config, }: UpdateArtifact): Promise<UpdateArtifactsResult[] | null>;
