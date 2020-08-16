"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPackageFile = void 0;
const logger_1 = require("../../logger");
const modules_1 = require("./modules");
const providers_1 = require("./providers");
const required_providers_1 = require("./required_providers");
const resources_1 = require("./resources");
const util_1 = require("./util");
const dependencyBlockExtractionRegex = /^\s*(?<type>[a-z_]+)\s+("(?<lookupName>[^"]+)"\s+)?("(?<terraformName>[^"]+)"\s+)?{\s*$/;
const contentCheckList = [
    'module "',
    'provider "',
    'required_providers ',
    ' "helm_release" ',
    ' "docker_image" ',
];
function extractPackageFile(content) {
    logger_1.logger.trace({ content }, 'terraform.extractPackageFile()');
    if (!util_1.checkFileContainsDependency(content, contentCheckList)) {
        return null;
    }
    let deps = [];
    try {
        const lines = content.split('\n');
        for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
            const line = lines[lineNumber];
            const terraformDependency = dependencyBlockExtractionRegex.exec(line);
            if (terraformDependency) {
                logger_1.logger.trace(`Matched ${terraformDependency.groups.type} on line ${lineNumber}`);
                const tfDepType = util_1.getTerraformDependencyType(terraformDependency.groups.type);
                let result = null;
                switch (tfDepType) {
                    case util_1.TerraformDependencyTypes.required_providers: {
                        result = required_providers_1.extractTerraformRequiredProviders(lineNumber, lines);
                        break;
                    }
                    case util_1.TerraformDependencyTypes.provider: {
                        result = providers_1.extractTerraformProvider(lineNumber, lines, terraformDependency.groups.lookupName);
                        break;
                    }
                    case util_1.TerraformDependencyTypes.module: {
                        result = modules_1.extractTerraformModule(lineNumber, lines, terraformDependency.groups.lookupName);
                        break;
                    }
                    case util_1.TerraformDependencyTypes.resource: {
                        result = resources_1.extractTerraformResource(lineNumber, lines);
                        break;
                    }
                    /* istanbul ignore next */
                    default:
                        logger_1.logger.trace(`Could not identify TerraformDependencyType ${terraformDependency.groups.type} on line ${lineNumber}.`);
                        break;
                }
                if (result) {
                    lineNumber = result.lineNumber;
                    deps = deps.concat(result.dependencies);
                    result = null;
                }
            }
        }
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.warn({ err }, 'Error extracting buildkite plugins');
    }
    deps.forEach((dep) => {
        switch (dep.managerData.terraformDependencyType) {
            case util_1.TerraformDependencyTypes.required_providers:
            case util_1.TerraformDependencyTypes.provider:
                providers_1.analyzeTerraformProvider(dep);
                break;
            case util_1.TerraformDependencyTypes.module:
                modules_1.analyseTerraformModule(dep);
                break;
            case util_1.TerraformDependencyTypes.resource:
                resources_1.analyseTerraformResource(dep);
                break;
            /* istanbul ignore next */
            default:
        }
        // eslint-disable-next-line no-param-reassign
        delete dep.managerData;
    });
    if (deps.some((dep) => dep.skipReason !== 'local')) {
        return { deps };
    }
    return null;
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map