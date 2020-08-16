import { ArtifactError } from '../../manager/common';
import { File } from '../../util/git';
import { BranchConfig } from '../common';
export interface PackageFilesResult {
    artifactErrors: ArtifactError[];
    reuseExistingBranch?: boolean;
    updatedPackageFiles: File[];
    updatedArtifacts: File[];
}
export declare function getUpdatedPackageFiles(config: BranchConfig): Promise<PackageFilesResult>;
