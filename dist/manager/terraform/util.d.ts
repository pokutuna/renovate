import { PackageDependency } from '../common';
export declare const keyValueExtractionRegex: RegExp;
export declare const resourceTypeExtractionRegex: RegExp;
export interface ExtractionResult {
    lineNumber: number;
    dependencies: PackageDependency[];
}
export declare enum TerraformDependencyTypes {
    unknown = "unknown",
    module = "module",
    provider = "provider",
    required_providers = "required_providers",
    resource = "resource"
}
export interface TerraformManagerData {
    terraformDependencyType: TerraformDependencyTypes;
}
export declare enum TerraformResourceTypes {
    unknown = "unknown",
    /**
     * https://www.terraform.io/docs/providers/docker/r/container.html
     */
    docker_container = "docker_container",
    /**
     * https://www.terraform.io/docs/providers/docker/r/image.html
     */
    docker_image = "docker_image",
    /**
     * https://www.terraform.io/docs/providers/docker/r/service.html
     */
    docker_service = "docker_service",
    /**
     * https://www.terraform.io/docs/providers/helm/r/release.html
     */
    helm_release = "helm_release"
}
export interface ResourceManagerData extends TerraformManagerData {
    resourceType?: TerraformResourceTypes;
    chart?: string;
    image?: string;
    name?: string;
    repository?: string;
}
export declare function getTerraformDependencyType(value: string): TerraformDependencyTypes;
export declare function checkFileContainsDependency(content: string, checkList: string[]): boolean;
export declare function checkIfStringIsPath(path: string): boolean;
