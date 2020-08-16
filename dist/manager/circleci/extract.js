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
const datasourceOrb = __importStar(require("../../datasource/orb"));
const logger_1 = require("../../logger");
const npmVersioning = __importStar(require("../../versioning/npm"));
const extract_1 = require("../dockerfile/extract");
function extractPackageFile(content) {
    const deps = [];
    try {
        const lines = content.split('\n');
        for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
            const line = lines[lineNumber];
            const orbs = /^\s*orbs:\s*$/.exec(line);
            if (orbs) {
                logger_1.logger.trace(`Matched orbs on line ${lineNumber}`);
                let foundOrb;
                do {
                    foundOrb = false;
                    const orbLine = lines[lineNumber + 1];
                    logger_1.logger.trace(`orbLine: "${orbLine}"`);
                    const orbMatch = /^\s+([^:]+):\s(.+)$/.exec(orbLine);
                    if (orbMatch) {
                        logger_1.logger.trace('orbMatch');
                        foundOrb = true;
                        lineNumber += 1;
                        const depName = orbMatch[1];
                        const [orbName, currentValue] = orbMatch[2].split('@');
                        const dep = {
                            depType: 'orb',
                            depName,
                            currentValue,
                            datasource: datasourceOrb.id,
                            lookupName: orbName,
                            commitMessageTopic: '{{{depName}}} orb',
                            versioning: npmVersioning.id,
                            rangeStrategy: 'pin',
                        };
                        deps.push(dep);
                    }
                } while (foundOrb);
            }
            const match = /^\s*- image:\s*'?"?([^\s'"]+)'?"?\s*$/.exec(line);
            if (match) {
                const currentFrom = match[1];
                const dep = extract_1.getDep(currentFrom);
                logger_1.logger.debug({
                    depName: dep.depName,
                    currentValue: dep.currentValue,
                    currentDigest: dep.currentDigest,
                }, 'CircleCI docker image');
                dep.depType = 'docker';
                dep.versioning = 'docker';
                deps.push(dep);
            }
        }
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.warn({ err }, 'Error extracting circleci images');
    }
    if (!deps.length) {
        return null;
    }
    return { deps };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map