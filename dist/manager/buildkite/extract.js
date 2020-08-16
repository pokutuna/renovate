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
const datasourceGithubTags = __importStar(require("../../datasource/github-tags"));
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const semver_1 = require("../../versioning/semver");
function extractPackageFile(content) {
    const deps = [];
    try {
        const lines = content.split('\n');
        let isPluginsSection = false;
        let pluginsIndent = '';
        for (let lineNumber = 1; lineNumber <= lines.length; lineNumber += 1) {
            const lineIdx = lineNumber - 1;
            const line = lines[lineIdx];
            const pluginsSection = /^(?<pluginsIndent>\s*)(-?\s*)plugins:/.exec(line);
            if (pluginsSection) {
                logger_1.logger.trace(`Matched plugins on line ${lineNumber}`);
                isPluginsSection = true;
                pluginsIndent = pluginsSection.groups.pluginsIndent;
            }
            else if (isPluginsSection) {
                logger_1.logger.debug(`serviceImageLine: "${line}"`);
                const { currentIndent } = /^(?<currentIndent>\s*)/.exec(line).groups;
                const depLineMatch = /^\s+(?:-\s+)?(?<depName>[^#]+)#(?<currentValue>[^:]+)/.exec(line);
                if (currentIndent.length <= pluginsIndent.length) {
                    isPluginsSection = false;
                    pluginsIndent = '';
                }
                else if (depLineMatch) {
                    const { depName, currentValue } = depLineMatch.groups;
                    logger_1.logger.trace('depLineMatch');
                    let skipReason;
                    let repo;
                    if (depName.startsWith('https://') || depName.startsWith('git@')) {
                        logger_1.logger.debug({ dependency: depName }, 'Skipping git plugin');
                        skipReason = types_1.SkipReason.GitPlugin;
                    }
                    else if (!semver_1.isVersion(currentValue)) {
                        logger_1.logger.debug({ currentValue }, 'Skipping non-pinned current version');
                        skipReason = types_1.SkipReason.InvalidVersion;
                    }
                    else {
                        const splitName = depName.split('/');
                        if (splitName.length === 1) {
                            repo = `buildkite-plugins/${depName}-buildkite-plugin`;
                        }
                        else if (splitName.length === 2) {
                            repo = `${depName}-buildkite-plugin`;
                        }
                        else {
                            logger_1.logger.warn({ dependency: depName }, 'Something is wrong with buildkite plugin name');
                            skipReason = types_1.SkipReason.Unknown;
                        }
                    }
                    const dep = {
                        depName,
                        currentValue,
                        skipReason,
                    };
                    if (repo) {
                        dep.datasource = datasourceGithubTags.id;
                        dep.lookupName = repo;
                    }
                    deps.push(dep);
                }
            }
        }
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.warn({ err }, 'Error extracting buildkite plugins');
    }
    if (!deps.length) {
        return null;
    }
    return { deps };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map