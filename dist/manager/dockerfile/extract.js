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
exports.extractPackageFile = exports.getDep = exports.splitImageParts = void 0;
const datasourceDocker = __importStar(require("../../datasource/docker"));
const logger_1 = require("../../logger");
const types_1 = require("../../types");
function splitImageParts(currentFrom) {
    if (currentFrom.includes('$')) {
        return {
            skipReason: types_1.SkipReason.ContainsVariable,
        };
    }
    const [currentDepTag, currentDigest] = currentFrom.split('@');
    const depTagSplit = currentDepTag.split(':');
    let depName;
    let currentValue;
    if (depTagSplit.length === 1 ||
        depTagSplit[depTagSplit.length - 1].includes('/')) {
        depName = currentDepTag;
    }
    else {
        currentValue = depTagSplit.pop();
        depName = depTagSplit.join(':');
    }
    const dep = {
        depName,
        currentValue,
        currentDigest,
    };
    return dep;
}
exports.splitImageParts = splitImageParts;
function getDep(currentFrom, specifyReplaceString = true) {
    const dep = splitImageParts(currentFrom);
    if (specifyReplaceString) {
        dep.replaceString = currentFrom;
        dep.autoReplaceStringTemplate =
            '{{depName}}{{#if newValue}}:{{newValue}}{{/if}}{{#if newDigest}}@{{newDigest}}{{/if}}';
    }
    dep.datasource = datasourceDocker.id;
    if (dep.depName &&
        (dep.depName === 'node' || dep.depName.endsWith('/node')) &&
        dep.depName !== 'calico/node') {
        dep.commitMessageTopic = 'Node.js';
    }
    return dep;
}
exports.getDep = getDep;
function extractPackageFile(content) {
    const deps = [];
    const stageNames = [];
    let lineNumber = 0;
    for (const fromLine of content.split('\n')) {
        const fromMatch = /^FROM /i.test(fromLine);
        if (fromMatch) {
            logger_1.logger.trace({ lineNumber, fromLine }, 'FROM line');
            const [, currentFrom, ...fromRest] = fromLine.match(/\S+/g);
            if (fromRest.length === 2 && fromRest[0].toLowerCase() === 'as') {
                logger_1.logger.debug('Found a multistage build stage name');
                stageNames.push(fromRest[1]);
            }
            if (currentFrom === 'scratch') {
                logger_1.logger.debug('Skipping scratch');
            }
            else if (stageNames.includes(currentFrom)) {
                logger_1.logger.debug({ currentFrom }, 'Skipping alias FROM');
            }
            else {
                const dep = getDep(currentFrom);
                logger_1.logger.trace({
                    depName: dep.depName,
                    currentValue: dep.currentValue,
                    currentDigest: dep.currentDigest,
                }, 'Dockerfile FROM');
                deps.push(dep);
            }
        }
        const copyFromMatch = /^(COPY --from=)([^\s]+)\s+(.*)$/i.exec(fromLine);
        if (copyFromMatch) {
            const [, , currentFrom] = copyFromMatch;
            logger_1.logger.trace({ lineNumber, fromLine }, 'COPY --from line');
            if (stageNames.includes(currentFrom)) {
                logger_1.logger.debug({ currentFrom }, 'Skipping alias COPY --from');
            }
            else if (!Number.isNaN(Number(currentFrom))) {
                logger_1.logger.debug({ currentFrom }, 'Skipping index reference COPY --from');
            }
            else {
                const dep = getDep(currentFrom);
                logger_1.logger.debug({
                    depName: dep.depName,
                    currentValue: dep.currentValue,
                    currentDigest: dep.currentDigest,
                }, 'Dockerfile COPY --from');
                deps.push(dep);
            }
        }
        lineNumber += 1;
    }
    if (!deps.length) {
        return null;
    }
    for (const d of deps) {
        d.depType = 'stage';
    }
    deps[deps.length - 1].depType = 'final';
    return { deps };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map