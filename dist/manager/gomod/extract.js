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
const semver_1 = require("semver");
const datasourceGo = __importStar(require("../../datasource/go"));
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const semver_2 = require("../../versioning/semver");
function getDep(lineNumber, match, type) {
    const [, , currentValue] = match;
    let [, depName] = match;
    depName = depName.replace(/"/g, '');
    const dep = {
        managerData: {
            lineNumber,
        },
        depName,
        depType: type,
        currentValue,
    };
    if (!semver_2.isVersion(currentValue)) {
        dep.skipReason = types_1.SkipReason.UnsupportedVersion;
    }
    else {
        if (depName.startsWith('gopkg.in/')) {
            const [pkg] = depName.replace('gopkg.in/', '').split('.');
            dep.depNameShort = pkg;
        }
        else if (depName.startsWith('github.com/')) {
            dep.depNameShort = depName.replace('github.com/', '');
        }
        else {
            dep.depNameShort = depName;
        }
        dep.datasource = datasourceGo.id;
    }
    const digestMatch = /v0\.0.0-\d{14}-([a-f0-9]{12})/.exec(currentValue);
    if (digestMatch) {
        [, dep.currentDigest] = digestMatch;
        dep.digestOneAndOnly = true;
    }
    return dep;
}
function extractPackageFile(content) {
    logger_1.logger.trace({ content }, 'gomod.extractPackageFile()');
    const compatibility = {};
    const deps = [];
    try {
        const lines = content.split('\n');
        for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
            let line = lines[lineNumber];
            if (line.startsWith('go ') && semver_1.validRange(line.replace('go ', ''))) {
                compatibility.go = line.replace('go ', '');
            }
            const replaceMatch = /^replace\s+[^\s]+[\s]+[=][>]\s+([^\s]+)\s+([^\s]+)/.exec(line);
            if (replaceMatch) {
                const dep = getDep(lineNumber, replaceMatch, 'replace');
                deps.push(dep);
            }
            const requireMatch = /^require\s+([^\s]+)\s+([^\s]+)/.exec(line);
            if (requireMatch && !line.endsWith('// indirect')) {
                logger_1.logger.trace({ lineNumber }, `require line: "${line}"`);
                const dep = getDep(lineNumber, requireMatch, 'require');
                deps.push(dep);
            }
            if (line.trim() === 'require (') {
                logger_1.logger.trace(`Matched multi-line require on line ${lineNumber}`);
                do {
                    lineNumber += 1;
                    line = lines[lineNumber];
                    const multiMatch = /^\s+([^\s]+)\s+([^\s]+)/.exec(line);
                    logger_1.logger.trace(`reqLine: "${line}"`);
                    if (multiMatch && !line.endsWith('// indirect')) {
                        logger_1.logger.trace({ lineNumber }, `require line: "${line}"`);
                        const dep = getDep(lineNumber, multiMatch, 'require');
                        dep.managerData.multiLine = true;
                        deps.push(dep);
                    }
                    else if (line.trim() !== ')') {
                        logger_1.logger.debug(`No multi-line match: ${line}`);
                    }
                } while (line.trim() !== ')');
            }
        }
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.warn({ err }, 'Error extracting go modules');
    }
    if (!deps.length) {
        return null;
    }
    return { compatibility, deps };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map