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
exports.extractPackageFile = void 0;
const specifier_1 = require("@renovate/pep440/lib/specifier");
const is_1 = __importDefault(require("@sindresorhus/is"));
const toml_1 = __importDefault(require("toml"));
const datasourcePypi = __importStar(require("../../datasource/pypi"));
const logger_1 = require("../../logger");
const types_1 = require("../../types");
// based on https://www.python.org/dev/peps/pep-0508/#names
const packageRegex = /^([A-Z0-9]|[A-Z0-9][A-Z0-9._-]*[A-Z0-9])$/i;
const rangePattern = specifier_1.RANGE_PATTERN;
const specifierPartPattern = `\\s*${rangePattern.replace(/\?<\w+>/g, '?:')}\\s*`;
const specifierPattern = `${specifierPartPattern}(?:,${specifierPartPattern})*`;
function extractFromSection(pipfile, section) {
    if (!(section in pipfile)) {
        return [];
    }
    const specifierRegex = new RegExp(`^${specifierPattern}$`);
    const pipfileSection = pipfile[section];
    const deps = Object.entries(pipfileSection)
        .map((x) => {
        const [depName, requirements] = x;
        let currentValue;
        let nestedVersion;
        let skipReason;
        if (requirements.git) {
            skipReason = types_1.SkipReason.GitDependency;
        }
        else if (requirements.file) {
            skipReason = types_1.SkipReason.FileDependency;
        }
        else if (requirements.path) {
            skipReason = types_1.SkipReason.LocalDependency;
        }
        else if (requirements.version) {
            currentValue = requirements.version;
            nestedVersion = true;
        }
        else if (is_1.default.object(requirements)) {
            skipReason = types_1.SkipReason.AnyVersion;
        }
        else {
            currentValue = requirements;
        }
        if (currentValue === '*') {
            skipReason = types_1.SkipReason.AnyVersion;
        }
        if (!skipReason) {
            const packageMatches = packageRegex.exec(depName);
            if (!packageMatches) {
                logger_1.logger.debug(`Skipping dependency with malformed package name "${depName}".`);
                skipReason = types_1.SkipReason.InvalidName;
            }
            const specifierMatches = specifierRegex.exec(currentValue);
            if (!specifierMatches) {
                logger_1.logger.debug(`Skipping dependency with malformed version specifier "${currentValue}".`);
                skipReason = types_1.SkipReason.InvalidVersion;
            }
        }
        const dep = {
            depType: section,
            depName,
            managerData: {},
        };
        if (currentValue) {
            dep.currentValue = currentValue;
        }
        if (skipReason) {
            dep.skipReason = skipReason;
        }
        else {
            dep.datasource = datasourcePypi.id;
        }
        if (nestedVersion) {
            dep.managerData.nestedVersion = nestedVersion;
        }
        if (requirements.index) {
            if (is_1.default.array(pipfile.source)) {
                const source = pipfile.source.find((item) => item.name === requirements.index);
                if (source) {
                    dep.registryUrls = [source.url];
                }
            }
        }
        return dep;
    })
        .filter(Boolean);
    return deps;
}
function extractPackageFile(content) {
    logger_1.logger.debug('pipenv.extractPackageFile()');
    let pipfile;
    try {
        pipfile = toml_1.default.parse(content);
    }
    catch (err) {
        logger_1.logger.debug({ err }, 'Error parsing Pipfile');
        return null;
    }
    const res = { deps: [] };
    if (pipfile.source) {
        res.registryUrls = pipfile.source.map((source) => source.url);
    }
    res.deps = [
        ...extractFromSection(pipfile, 'packages'),
        ...extractFromSection(pipfile, 'dev-packages'),
    ];
    if (res.deps.length) {
        return res;
    }
    return null;
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map