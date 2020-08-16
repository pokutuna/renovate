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
exports.extractPackageFile = exports.gitDep = exports.parseLine = void 0;
const datasourceGithubTags = __importStar(require("../../datasource/github-tags"));
const datasourcePod = __importStar(require("../../datasource/pod"));
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const regexMappings = [
    /^\s*pod\s+(['"])(?<spec>[^'"/]+)(\/(?<subspec>[^'"]+))?\1/,
    /^\s*pod\s+(['"])[^'"]+\1\s*,\s*(['"])(?<currentValue>[^'"]+)\2\s*$/,
    /,\s*:git\s*=>\s*(['"])(?<git>[^'"]+)\1/,
    /,\s*:tag\s*=>\s*(['"])(?<tag>[^'"]+)\1/,
    /,\s*:path\s*=>\s*(['"])(?<path>[^'"]+)\1/,
    /^\s*source\s*(['"])(?<source>[^'"]+)\1/,
];
function parseLine(line) {
    const result = {};
    if (!line) {
        return result;
    }
    for (const regex of Object.values(regexMappings)) {
        const match = regex.exec(line.replace(/#.*$/, ''));
        if (match === null || match === void 0 ? void 0 : match.groups) {
            Object.assign(result, match.groups);
        }
    }
    if (result.spec) {
        const depName = result.subspec
            ? `${result.spec}/${result.subspec}`
            : result.spec;
        const groupName = result.spec;
        if (depName) {
            result.depName = depName;
        }
        if (groupName) {
            result.groupName = groupName;
        }
        delete result.spec;
        delete result.subspec;
    }
    return result;
}
exports.parseLine = parseLine;
function gitDep(parsedLine) {
    const { depName, git, tag } = parsedLine;
    if (git === null || git === void 0 ? void 0 : git.startsWith('https://github.com/')) {
        const githubMatch = /https:\/\/github\.com\/(?<account>[^/]+)\/(?<repo>[^/]+)/.exec(git);
        const { account, repo } = (githubMatch === null || githubMatch === void 0 ? void 0 : githubMatch.groups) || {};
        if (account && repo) {
            return {
                datasource: datasourceGithubTags.id,
                depName,
                lookupName: `${account}/${repo.replace(/\.git$/, '')}`,
                currentValue: tag,
            };
        }
    }
    return null; // TODO: gitlab or gitTags datasources?
}
exports.gitDep = gitDep;
function extractPackageFile(content) {
    logger_1.logger.trace('cocoapods.extractPackageFile()');
    const deps = [];
    const lines = content.split('\n');
    const registryUrls = [];
    for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
        const line = lines[lineNumber];
        const parsedLine = parseLine(line);
        const { depName, groupName, currentValue, git, tag, path, source, } = parsedLine;
        if (source) {
            registryUrls.push(source.replace(/\/*$/, ''));
        }
        if (depName) {
            const managerData = { lineNumber };
            let dep = {
                depName,
                groupName,
                skipReason: types_1.SkipReason.UnknownVersion,
            };
            if (currentValue) {
                dep = {
                    depName,
                    groupName,
                    datasource: datasourcePod.id,
                    currentValue,
                    managerData,
                    registryUrls,
                };
            }
            else if (git) {
                if (tag) {
                    dep = { ...gitDep(parsedLine), managerData };
                }
                else {
                    dep = {
                        depName,
                        groupName,
                        skipReason: types_1.SkipReason.GitDependency,
                    };
                }
            }
            else if (path) {
                dep = {
                    depName,
                    groupName,
                    skipReason: types_1.SkipReason.PathDependency,
                };
            }
            deps.push(dep);
        }
    }
    return deps.length ? { deps } : null;
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map