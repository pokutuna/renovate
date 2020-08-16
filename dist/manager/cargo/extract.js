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
exports.extractPackageFile = void 0;
const toml_1 = require("toml");
const datasourceCrate = __importStar(require("../../datasource/crate"));
const logger_1 = require("../../logger");
const types_1 = require("../../types");
function extractFromSection(parsedContent, section, target) {
    const deps = [];
    const sectionContent = parsedContent[section];
    if (!sectionContent) {
        return [];
    }
    Object.keys(sectionContent).forEach((depName) => {
        let skipReason;
        let currentValue = sectionContent[depName];
        let nestedVersion = false;
        if (typeof currentValue !== 'string') {
            const version = currentValue.version;
            const path = currentValue.path;
            const git = currentValue.git;
            if (version) {
                currentValue = version;
                nestedVersion = true;
                if (path) {
                    skipReason = types_1.SkipReason.PathDependency;
                }
                if (git) {
                    skipReason = types_1.SkipReason.GitDependency;
                }
            }
            else if (path) {
                currentValue = '';
                skipReason = types_1.SkipReason.PathDependency;
            }
            else if (git) {
                currentValue = '';
                skipReason = types_1.SkipReason.GitDependency;
            }
            else {
                currentValue = '';
                skipReason = types_1.SkipReason.InvalidDependencySpecification;
            }
        }
        const dep = {
            depName,
            depType: section,
            currentValue: currentValue,
            managerData: { nestedVersion },
            datasource: datasourceCrate.id,
        };
        if (skipReason) {
            dep.skipReason = skipReason;
        }
        if (target) {
            dep.target = target;
        }
        deps.push(dep);
    });
    return deps;
}
function extractPackageFile(content, fileName) {
    logger_1.logger.trace(`cargo.extractPackageFile(${fileName})`);
    let parsedContent;
    try {
        parsedContent = toml_1.parse(content);
    }
    catch (err) {
        logger_1.logger.debug({ err }, 'Error parsing Cargo.toml file');
        return null;
    }
    /*
      There are the following sections in Cargo.toml:
      [dependencies]
      [dev-dependencies]
      [build-dependencies]
      [target.*.dependencies]
    */
    const targetSection = parsedContent.target;
    // An array of all dependencies in the target section
    let targetDeps = [];
    if (targetSection) {
        const targets = Object.keys(targetSection);
        targets.forEach((target) => {
            const targetContent = parsedContent.target[target];
            // Dependencies for `${target}`
            const deps = [
                ...extractFromSection(targetContent, 'dependencies', target),
                ...extractFromSection(targetContent, 'dev-dependencies', target),
                ...extractFromSection(targetContent, 'build-dependencies', target),
            ];
            targetDeps = targetDeps.concat(deps);
        });
    }
    const deps = [
        ...extractFromSection(parsedContent, 'dependencies'),
        ...extractFromSection(parsedContent, 'dev-dependencies'),
        ...extractFromSection(parsedContent, 'build-dependencies'),
        ...targetDeps,
    ];
    if (!deps.length) {
        return null;
    }
    return { deps };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map