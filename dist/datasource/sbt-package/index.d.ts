import { GetReleasesConfig, ReleaseResult } from '../common';
export declare const id = "sbt-package";
export declare const defaultRegistryUrls: string[];
export declare const registryStrategy = "hunt";
export declare function getArtifactSubdirs(searchRoot: string, artifact: string, scalaVersion: string): Promise<string[]>;
export declare function getPackageReleases(searchRoot: string, artifactSubdirs: string[]): Promise<string[]>;
export declare function getLatestVersion(versions: string[]): string | null;
export declare function getUrls(searchRoot: string, artifactDirs: string[], version: string): Promise<Partial<ReleaseResult>>;
export declare function getReleases({ lookupName, registryUrl, }: GetReleasesConfig): Promise<ReleaseResult | null>;
