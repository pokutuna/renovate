"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyseTerraformResource = exports.extractTerraformResource = void 0;
const datasourceHelm = __importStar(require("../../datasource/helm"));
const types_1 = require("../../types");
const hashicorp_1 = require("../../versioning/hashicorp");
const extract_1 = require("../dockerfile/extract");
const util_1 = require("./util");
function applyDockerDependency(dep, value) {
    const dockerDep = extract_1.getDep(value);
    Object.assign(dep, dockerDep);
}
function extractTerraformResource(startingLine, lines) {
    var _a, _b;
    let lineNumber = startingLine;
    let line = lines[lineNumber];
    const deps = [];
    const dep = {
        managerData: {
            terraformDependencyType: util_1.TerraformDependencyTypes.resource,
        },
    };
    const typeMatch = util_1.resourceTypeExtractionRegex.exec(line);
    dep.managerData.resourceType = (_b = util_1.TerraformResourceTypes[(_a = typeMatch === null || typeMatch === void 0 ? void 0 : typeMatch.groups) === null || _a === void 0 ? void 0 : _a.type]) !== null && _b !== void 0 ? _b : util_1.TerraformResourceTypes.unknown;
    do {
        lineNumber += 1;
        line = lines[lineNumber];
        const kvMatch = util_1.keyValueExtractionRegex.exec(line);
        if (kvMatch) {
            switch (kvMatch.groups.key) {
                case 'chart':
                case 'image':
                case 'name':
                case 'repository':
                    dep.managerData[kvMatch.groups.key] = kvMatch.groups.value;
                    break;
                case 'version':
                    dep.currentValue = kvMatch.groups.value;
                    break;
                default:
                    /* istanbul ignore next */
                    break;
            }
        }
    } while (line.trim() !== '}');
    deps.push(dep);
    return { lineNumber, dependencies: deps };
}
exports.extractTerraformResource = extractTerraformResource;
function analyseTerraformResource(dep) {
    /* eslint-disable no-param-reassign */
    switch (dep.managerData.resourceType) {
        case util_1.TerraformResourceTypes.docker_container:
            if (!dep.managerData.image) {
                dep.skipReason = types_1.SkipReason.InvalidDependencySpecification;
            }
            else {
                applyDockerDependency(dep, dep.managerData.image);
            }
            break;
        case util_1.TerraformResourceTypes.docker_image:
            if (!dep.managerData.name) {
                dep.skipReason = types_1.SkipReason.InvalidDependencySpecification;
            }
            else {
                applyDockerDependency(dep, dep.managerData.name);
            }
            break;
        case util_1.TerraformResourceTypes.docker_service:
            if (!dep.managerData.image) {
                dep.skipReason = types_1.SkipReason.InvalidDependencySpecification;
            }
            else {
                applyDockerDependency(dep, dep.managerData.image);
            }
            break;
        case util_1.TerraformResourceTypes.helm_release:
            if (dep.managerData.chart == null) {
                dep.skipReason = types_1.SkipReason.InvalidName;
            }
            else if (util_1.checkIfStringIsPath(dep.managerData.chart)) {
                dep.skipReason = types_1.SkipReason.LocalChart;
            }
            else if (!hashicorp_1.isValid(dep.currentValue)) {
                dep.skipReason = types_1.SkipReason.UnsupportedVersion;
            }
            dep.depType = 'helm';
            dep.registryUrls = [dep.managerData.repository];
            dep.depName = dep.managerData.chart;
            dep.depNameShort = dep.managerData.chart;
            dep.datasource = datasourceHelm.id;
            break;
        default:
            dep.skipReason = types_1.SkipReason.UnsupportedValue;
            break;
    }
    /* eslint-enable no-param-reassign */
}
exports.analyseTerraformResource = analyseTerraformResource;
//# sourceMappingURL=resources.js.map