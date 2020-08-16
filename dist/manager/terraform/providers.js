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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeTerraformProvider = exports.extractTerraformProvider = exports.sourceExtractionRegex = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const datasourceTerraformProvider = __importStar(require("../../datasource/terraform-provider"));
const types_1 = require("../../types");
const hashicorp_1 = require("../../versioning/hashicorp");
const util_1 = require("./util");
exports.sourceExtractionRegex = /^(?:(?<hostname>[^/]+)\/)?(?<namespace>[^/]+)\/(?<type>[^/]+)/;
function extractTerraformProvider(startingLine, lines, moduleName) {
    let lineNumber = startingLine;
    let line;
    const deps = [];
    const dep = {
        managerData: {
            moduleName,
            terraformDependencyType: util_1.TerraformDependencyTypes.provider,
        },
    };
    do {
        lineNumber += 1;
        line = lines[lineNumber];
        const kvMatch = util_1.keyValueExtractionRegex.exec(line);
        if (kvMatch) {
            if (kvMatch.groups.key === 'version') {
                dep.currentValue = kvMatch.groups.value;
            }
            else if (kvMatch.groups.key === 'source') {
                dep.managerData.source = kvMatch.groups.value;
                dep.managerData.sourceLine = lineNumber;
            }
        }
    } while (line.trim() !== '}');
    deps.push(dep);
    return { lineNumber, dependencies: deps };
}
exports.extractTerraformProvider = extractTerraformProvider;
function analyzeTerraformProvider(dep) {
    /* eslint-disable no-param-reassign */
    dep.depType = 'terraform';
    dep.depName = dep.managerData.moduleName;
    dep.depNameShort = dep.managerData.moduleName;
    dep.datasource = datasourceTerraformProvider.id;
    if (!hashicorp_1.isValid(dep.currentValue)) {
        dep.skipReason = types_1.SkipReason.UnsupportedVersion;
    }
    if (is_1.default.nonEmptyString(dep.managerData.source)) {
        const source = exports.sourceExtractionRegex.exec(dep.managerData.source);
        if (source) {
            // buildin providers https://github.com/terraform-providers
            if (source.groups.namespace === 'terraform-providers') {
                dep.registryUrls = [`https://releases.hashicorp.com`];
            }
            else {
                dep.lookupName = `${source.groups.namespace}/${source.groups.type}`;
                if (source.groups.hostname) {
                    dep.registryUrls = [`https://${source.groups.hostname}`];
                }
                else {
                    dep.registryUrls = [`https://registry.terraform.io`];
                }
            }
        }
        else {
            dep.skipReason = types_1.SkipReason.UnsupportedUrl;
        }
    }
    /* eslint-enable no-param-reassign */
}
exports.analyzeTerraformProvider = analyzeTerraformProvider;
//# sourceMappingURL=providers.js.map