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
const is_1 = __importDefault(require("@sindresorhus/is"));
const toml_1 = require("toml");
const datasourcePypi = __importStar(require("../../datasource/pypi"));
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const pep440Versioning = __importStar(require("../../versioning/pep440"));
const poetryVersioning = __importStar(require("../../versioning/poetry"));
function extractFromSection(parsedFile, section) {
    const deps = [];
    const sectionContent = parsedFile.tool.poetry[section];
    if (!sectionContent) {
        return [];
    }
    Object.keys(sectionContent).forEach((depName) => {
        if (depName === 'python') {
            return;
        }
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
                skipReason = types_1.SkipReason.MultipleConstraintDep;
            }
        }
        const dep = {
            depName,
            depType: section,
            currentValue: currentValue,
            managerData: { nestedVersion },
            datasource: datasourcePypi.id,
        };
        if (skipReason) {
            dep.skipReason = skipReason;
        }
        else if (pep440Versioning.isValid(dep.currentValue)) {
            dep.versioning = pep440Versioning.id;
        }
        else if (poetryVersioning.isValid(dep.currentValue)) {
            dep.versioning = poetryVersioning.id;
        }
        else {
            dep.skipReason = types_1.SkipReason.UnknownVersion;
        }
        deps.push(dep);
    });
    return deps;
}
function extractRegistries(pyprojectfile) {
    var _a, _b;
    const sources = (_b = (_a = pyprojectfile.tool) === null || _a === void 0 ? void 0 : _a.poetry) === null || _b === void 0 ? void 0 : _b.source;
    if (!Array.isArray(sources) || sources.length === 0) {
        return null;
    }
    const registryUrls = new Set();
    for (const source of sources) {
        if (source.url) {
            registryUrls.add(source.url);
        }
    }
    registryUrls.add('https://pypi.org/pypi/');
    return Array.from(registryUrls);
}
function extractPackageFile(content, fileName) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    logger_1.logger.trace(`poetry.extractPackageFile(${fileName})`);
    let pyprojectfile;
    try {
        pyprojectfile = toml_1.parse(content);
    }
    catch (err) {
        logger_1.logger.debug({ err }, 'Error parsing pyproject.toml file');
        return null;
    }
    if (!((_a = pyprojectfile.tool) === null || _a === void 0 ? void 0 : _a.poetry)) {
        logger_1.logger.debug(`${fileName} contains no poetry section`);
        return null;
    }
    const deps = [
        ...extractFromSection(pyprojectfile, 'dependencies'),
        ...extractFromSection(pyprojectfile, 'dev-dependencies'),
        ...extractFromSection(pyprojectfile, 'extras'),
    ];
    if (!deps.length) {
        return null;
    }
    const compatibility = {};
    // https://python-poetry.org/docs/pyproject/#poetry-and-pep-517
    if (((_b = pyprojectfile['build-system']) === null || _b === void 0 ? void 0 : _b['build-backend']) === 'poetry.masonry.api') {
        compatibility.poetry = (_c = pyprojectfile['build-system']) === null || _c === void 0 ? void 0 : _c.requires.join(' ');
    }
    if (is_1.default.nonEmptyString((_f = (_e = (_d = pyprojectfile.tool) === null || _d === void 0 ? void 0 : _d.poetry) === null || _e === void 0 ? void 0 : _e['dependencies']) === null || _f === void 0 ? void 0 : _f.python)) {
        compatibility.python = (_j = (_h = (_g = pyprojectfile.tool) === null || _g === void 0 ? void 0 : _g.poetry) === null || _h === void 0 ? void 0 : _h['dependencies']) === null || _j === void 0 ? void 0 : _j.python;
    }
    return {
        deps,
        registryUrls: extractRegistries(pyprojectfile),
        compatibility,
    };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map