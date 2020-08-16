import { GetReleasesConfig, ReleaseResult } from '../common';
export declare const id = "terraform-module";
export declare const defaultRegistryUrls: string[];
export declare const registryStrategy = "first";
export interface ServiceDiscoveryResult {
    'modules.v1'?: string;
    'providers.v1'?: string;
}
export declare function getTerraformServiceDiscoveryResult(registryUrl: string): Promise<ServiceDiscoveryResult>;
/**
 * terraform.getReleases
 *
 * This function will fetch a package from the specified Terraform registry and return all semver versions.
 *  - `sourceUrl` is supported of "source" field is set
 *  - `homepage` is set to the Terraform registry's page if it's on the official main registry
 */
export declare function getReleases({ lookupName, registryUrl, }: GetReleasesConfig): Promise<ReleaseResult | null>;
