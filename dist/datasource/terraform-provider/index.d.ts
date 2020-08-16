import { GetReleasesConfig, ReleaseResult } from '../common';
export declare const id = "terraform-provider";
export declare const defaultRegistryUrls: string[];
export declare const registryStrategy = "hunt";
/**
 * terraform-provider.getReleases
 *
 * This function will fetch a provider from the public Terraform registry and return all semver versions.
 */
export declare function getReleases({ lookupName, registryUrl, }: GetReleasesConfig): Promise<ReleaseResult | null>;
