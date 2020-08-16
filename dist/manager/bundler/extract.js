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
const datasourceRubygems = __importStar(require("../../datasource/rubygems"));
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const fs_1 = require("../../util/fs");
const regex_1 = require("../../util/regex");
const locked_version_1 = require("./locked-version");
async function extractPackageFile(content, fileName) {
    const res = {
        registryUrls: [],
        deps: [],
    };
    const lines = content.split('\n');
    const delimiters = ['"', "'"];
    for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
        const line = lines[lineNumber];
        let sourceMatch;
        for (const delimiter of delimiters) {
            sourceMatch =
                sourceMatch ||
                    regex_1.regEx(`^source ${delimiter}([^${delimiter}]+)${delimiter}\\s*$`).exec(line);
        }
        if (sourceMatch) {
            res.registryUrls.push(sourceMatch[1]);
        }
        let rubyMatch;
        for (const delimiter of delimiters) {
            rubyMatch =
                rubyMatch ||
                    regex_1.regEx(`^ruby ${delimiter}([^${delimiter}]+)${delimiter}`).exec(line);
        }
        if (rubyMatch) {
            res.compatibility = { ruby: rubyMatch[1] };
        }
        let gemMatch;
        let gemDelimiter;
        for (const delimiter of delimiters) {
            const gemMatchRegex = `^gem ${delimiter}([^${delimiter}]+)${delimiter}(,\\s+${delimiter}([^${delimiter}]+)${delimiter}){0,2}`;
            if (regex_1.regEx(gemMatchRegex).test(line)) {
                gemDelimiter = delimiter;
                gemMatch = gemMatch || regex_1.regEx(gemMatchRegex).exec(line);
            }
        }
        if (gemMatch) {
            const dep = {
                depName: gemMatch[1],
                managerData: { lineNumber },
            };
            if (gemMatch[3]) {
                let currentValue = gemMatch[0]
                    .substring(`gem ${gemDelimiter}${dep.depName}${gemDelimiter},`.length)
                    .trim();
                // strip quotes unless it's a complex constraint
                if (currentValue.startsWith(gemDelimiter) &&
                    currentValue.endsWith(gemDelimiter) &&
                    currentValue.split(gemDelimiter).length === 3) {
                    currentValue = currentValue.slice(1, -1);
                }
                dep.currentValue = currentValue;
            }
            else {
                dep.skipReason = types_1.SkipReason.NoVersion;
            }
            if (!dep.skipReason) {
                dep.datasource = datasourceRubygems.id;
            }
            res.deps.push(dep);
        }
        const groupMatch = /^group\s+(.*?)\s+do/.exec(line);
        if (groupMatch) {
            const depTypes = groupMatch[1]
                .split(',')
                .map((group) => group.trim())
                .map((group) => group.replace(/^:/, ''));
            const groupLineNumber = lineNumber;
            let groupContent = '';
            let groupLine = '';
            while (lineNumber < lines.length && groupLine !== 'end') {
                lineNumber += 1;
                groupLine = lines[lineNumber];
                if (groupLine !== 'end') {
                    groupContent += (groupLine || '').replace(/^ {2}/, '') + '\n';
                }
            }
            const groupRes = await extractPackageFile(groupContent);
            if (groupRes) {
                res.deps = res.deps.concat(groupRes.deps.map((dep) => ({
                    ...dep,
                    depTypes,
                    managerData: {
                        lineNumber: dep.managerData.lineNumber + groupLineNumber + 1,
                    },
                })));
            }
        }
        for (const delimiter of delimiters) {
            const sourceBlockMatch = regex_1.regEx(`^source\\s+${delimiter}(.*?)${delimiter}\\s+do`).exec(line);
            if (sourceBlockMatch) {
                const repositoryUrl = sourceBlockMatch[1];
                const sourceLineNumber = lineNumber;
                let sourceContent = '';
                let sourceLine = '';
                while (lineNumber < lines.length && sourceLine.trim() !== 'end') {
                    lineNumber += 1;
                    sourceLine = lines[lineNumber];
                    // istanbul ignore if
                    if (sourceLine === null || sourceLine === undefined) {
                        logger_1.logger.info({ content, fileName }, 'Undefined sourceLine');
                        sourceLine = 'end';
                    }
                    if (sourceLine !== 'end') {
                        sourceContent += sourceLine.replace(/^ {2}/, '') + '\n';
                    }
                }
                const sourceRes = await extractPackageFile(sourceContent);
                if (sourceRes) {
                    res.deps = res.deps.concat(sourceRes.deps.map((dep) => ({
                        ...dep,
                        registryUrls: [repositoryUrl],
                        managerData: {
                            lineNumber: dep.managerData.lineNumber + sourceLineNumber + 1,
                        },
                    })));
                }
            }
        }
        const platformsMatch = /^platforms\s+(.*?)\s+do/.test(line);
        if (platformsMatch) {
            const platformsLineNumber = lineNumber;
            let platformsContent = '';
            let platformsLine = '';
            while (lineNumber < lines.length && platformsLine !== 'end') {
                lineNumber += 1;
                platformsLine = lines[lineNumber];
                if (platformsLine !== 'end') {
                    platformsContent += platformsLine.replace(/^ {2}/, '') + '\n';
                }
            }
            const platformsRes = await extractPackageFile(platformsContent);
            if (platformsRes) {
                res.deps = res.deps.concat(
                // eslint-disable-next-line no-loop-func
                platformsRes.deps.map((dep) => ({
                    ...dep,
                    managerData: {
                        lineNumber: dep.managerData.lineNumber + platformsLineNumber + 1,
                    },
                })));
            }
        }
        const ifMatch = /^if\s+(.*?)/.test(line);
        if (ifMatch) {
            const ifLineNumber = lineNumber;
            let ifContent = '';
            let ifLine = '';
            while (lineNumber < lines.length && ifLine !== 'end') {
                lineNumber += 1;
                ifLine = lines[lineNumber];
                if (ifLine !== 'end') {
                    ifContent += ifLine.replace(/^ {2}/, '') + '\n';
                }
            }
            const ifRes = await extractPackageFile(ifContent);
            if (ifRes) {
                res.deps = res.deps.concat(
                // eslint-disable-next-line no-loop-func
                ifRes.deps.map((dep) => ({
                    ...dep,
                    managerData: {
                        lineNumber: dep.managerData.lineNumber + ifLineNumber + 1,
                    },
                })));
            }
        }
    }
    if (!res.deps.length && !res.registryUrls.length) {
        return null;
    }
    if (fileName) {
        const gemfileLock = fileName + '.lock';
        const lockContent = await fs_1.readLocalFile(gemfileLock, 'utf8');
        if (lockContent) {
            logger_1.logger.debug({ packageFile: fileName }, 'Found Gemfile.lock file');
            const lockedEntries = locked_version_1.extractLockFileEntries(lockContent);
            for (const dep of res.deps) {
                const lockedDepValue = lockedEntries.get(dep.depName);
                if (lockedDepValue) {
                    dep.lockedVersion = lockedDepValue;
                }
            }
            const bundledWith = /\nBUNDLED WITH\n\s+(.*?)(\n|$)/.exec(lockContent);
            if (bundledWith) {
                res.compatibility = res.compatibility || {};
                res.compatibility.bundler = bundledWith[1];
            }
        }
    }
    return res;
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map