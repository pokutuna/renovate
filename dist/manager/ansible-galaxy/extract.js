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
const datasourceGalaxy = __importStar(require("../../datasource/galaxy"));
const datasourceGitTags = __importStar(require("../../datasource/git-tags"));
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const galaxyRoleRegex = /.+\..+/;
function interpretLine(lineMatch, lineNumber, dependency) {
    const localDependency = dependency;
    const key = lineMatch[2];
    const value = lineMatch[3].replace(/["']/g, '');
    switch (key) {
        case 'name': {
            localDependency.managerData.name = value;
            break;
        }
        case 'version': {
            localDependency.managerData.version = value;
            localDependency.currentValue = value;
            localDependency.managerData.lineNumber = lineNumber;
            break;
        }
        case 'scm': {
            localDependency.managerData.scm = value;
            break;
        }
        case 'src': {
            localDependency.managerData.src = value;
            break;
        }
        default: {
            return null;
        }
    }
    return localDependency;
}
function finalize(dependency) {
    const dep = dependency;
    if (dependency.managerData.version === null) {
        dep.skipReason = types_1.SkipReason.NoVersion;
        return false;
    }
    const source = dep.managerData.src;
    const sourceMatch = new RegExp(/^(git|http|git\+http|ssh)s?(:\/\/|@).*(\/|:)(.+\/[^.]+)\/?(\.git)?$/).exec(source);
    if (sourceMatch) {
        dep.datasource = datasourceGitTags.id;
        dep.depName = sourceMatch[4];
        // remove leading `git+` from URLs like `git+https://...`
        dep.lookupName = source.replace(/git\+/, '');
    }
    else if (galaxyRoleRegex.exec(source)) {
        dep.datasource = datasourceGalaxy.id;
        dep.depName = dep.managerData.src;
        dep.lookupName = dep.managerData.src;
    }
    else if (galaxyRoleRegex.exec(dep.managerData.name)) {
        dep.datasource = datasourceGalaxy.id;
        dep.depName = dep.managerData.name;
        dep.lookupName = dep.managerData.name;
    }
    else {
        dep.skipReason = types_1.SkipReason.NoSourceMatch;
        return false;
    }
    if (dep.managerData.name !== null) {
        dep.depName = dep.managerData.name;
    }
    return true;
}
function extractPackageFile(content) {
    logger_1.logger.trace('ansible-galaxy.extractPackageFile()');
    const newBlockRegEx = new RegExp(/^\s*-\s*((\w+):\s*(.*))$/);
    const blockLineRegEx = new RegExp(/^\s*((\w+):\s*(.*))$/);
    const deps = [];
    const lines = content.split('\n');
    try {
        for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
            let lineMatch = newBlockRegEx.exec(lines[lineNumber]);
            if (lineMatch) {
                const dep = {
                    managerData: {
                        name: null,
                        version: null,
                        scm: null,
                        src: null,
                    },
                };
                do {
                    const localdep = interpretLine(lineMatch, lineNumber, dep);
                    if (localdep == null) {
                        break;
                    }
                    const line = lines[lineNumber + 1];
                    if (!line) {
                        break;
                    }
                    lineMatch = blockLineRegEx.exec(line);
                    if (lineMatch) {
                        lineNumber += 1;
                    }
                } while (lineMatch);
                if (finalize(dep)) {
                    delete dep.managerData;
                    deps.push(dep);
                }
            }
        }
        if (!deps.length) {
            return null;
        }
        return { deps };
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.debug({ err }, 'Error extracting ansible-galaxy deps');
        return null;
    }
}
exports.default = extractPackageFile;
//# sourceMappingURL=extract.js.map