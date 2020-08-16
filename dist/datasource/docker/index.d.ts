import { GetReleasesConfig, ReleaseResult } from '../common';
export declare const id = "docker";
export declare const defaultRegistryUrls: string[];
export declare const registryStrategy = "first";
export declare const defaultConfig: {
    managerBranchPrefix: string;
    commitMessageTopic: string;
    major: {
        enabled: boolean;
    };
    commitMessageExtra: string;
    digest: {
        branchTopic: string;
        commitMessageExtra: string;
        commitMessageTopic: string;
        group: {
            commitMessageTopic: string;
            commitMessageExtra: string;
        };
    };
    pin: {
        commitMessageExtra: string;
        groupName: string;
        group: {
            commitMessageTopic: string;
            branchTopic: string;
        };
    };
    group: {
        commitMessageTopic: string;
    };
};
export interface RegistryRepository {
    registry: string;
    repository: string;
}
export declare function getRegistryRepository(lookupName: string, registryUrl: string): RegistryRepository;
/**
 * docker.getDigest
 *
 * The `newValue` supplied here should be a valid tag for the docker image.
 *
 * This function will:
 *  - Look up a sha256 digest for a tag on its registry
 *  - Return the digest as a string
 */
export declare function getDigest({ registryUrl, lookupName }: GetReleasesConfig, newValue?: string): Promise<string | null>;
/**
 * docker.getReleases
 *
 * A docker image usually looks something like this: somehost.io/owner/repo:8.1.0-alpine
 * In the above:
 *  - 'somehost.io' is the registry
 *  - 'owner/repo' is the package name
 *  - '8.1.0-alpine' is the tag
 *
 * This function will filter only tags that contain a semver version
 */
export declare function getReleases({ lookupName, registryUrl, }: GetReleasesConfig): Promise<ReleaseResult | null>;
