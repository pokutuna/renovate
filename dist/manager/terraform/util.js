"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkIfStringIsPath = exports.checkFileContainsDependency = exports.getTerraformDependencyType = exports.TerraformResourceTypes = exports.TerraformDependencyTypes = exports.resourceTypeExtractionRegex = exports.keyValueExtractionRegex = void 0;
exports.keyValueExtractionRegex = /^\s*(?<key>[^\s]+)\s+=\s+"(?<value>[^"]+)"\s*$/;
exports.resourceTypeExtractionRegex = /^\s*resource\s+"(?<type>[^\s]+)"\s+"(?<name>[^"]+)"\s*{/;
var TerraformDependencyTypes;
(function (TerraformDependencyTypes) {
    TerraformDependencyTypes["unknown"] = "unknown";
    TerraformDependencyTypes["module"] = "module";
    TerraformDependencyTypes["provider"] = "provider";
    TerraformDependencyTypes["required_providers"] = "required_providers";
    TerraformDependencyTypes["resource"] = "resource";
})(TerraformDependencyTypes = exports.TerraformDependencyTypes || (exports.TerraformDependencyTypes = {}));
var TerraformResourceTypes;
(function (TerraformResourceTypes) {
    TerraformResourceTypes["unknown"] = "unknown";
    /**
     * https://www.terraform.io/docs/providers/docker/r/container.html
     */
    TerraformResourceTypes["docker_container"] = "docker_container";
    /**
     * https://www.terraform.io/docs/providers/docker/r/image.html
     */
    TerraformResourceTypes["docker_image"] = "docker_image";
    /**
     * https://www.terraform.io/docs/providers/docker/r/service.html
     */
    TerraformResourceTypes["docker_service"] = "docker_service";
    /**
     * https://www.terraform.io/docs/providers/helm/r/release.html
     */
    TerraformResourceTypes["helm_release"] = "helm_release";
})(TerraformResourceTypes = exports.TerraformResourceTypes || (exports.TerraformResourceTypes = {}));
function getTerraformDependencyType(value) {
    switch (value) {
        case 'module': {
            return TerraformDependencyTypes.module;
        }
        case 'provider': {
            return TerraformDependencyTypes.provider;
        }
        case 'required_providers': {
            return TerraformDependencyTypes.required_providers;
        }
        case 'resource': {
            return TerraformDependencyTypes.resource;
        }
        default: {
            return TerraformDependencyTypes.unknown;
        }
    }
}
exports.getTerraformDependencyType = getTerraformDependencyType;
function checkFileContainsDependency(content, checkList) {
    return checkList.some((check) => {
        return content.includes(check);
    });
}
exports.checkFileContainsDependency = checkFileContainsDependency;
const pathStringRegex = /(.|..)?(\/[^/])+/;
function checkIfStringIsPath(path) {
    const match = pathStringRegex.exec(path);
    return !!match;
}
exports.checkIfStringIsPath = checkIfStringIsPath;
//# sourceMappingURL=util.js.map