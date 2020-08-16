import { UpdateArtifact, UpdateArtifactsResult } from '../common';
export declare function updateArtifacts({ packageFileName: pipfileName, newPackageFileContent: newPipfileContent, config, }: UpdateArtifact): Promise<UpdateArtifactsResult[] | null>;
