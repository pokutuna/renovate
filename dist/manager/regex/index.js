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
exports.extractPackageFile = exports.defaultConfig = void 0;
const logger_1 = require("../../logger");
const regex_1 = require("../../util/regex");
const template = __importStar(require("../../util/template"));
exports.defaultConfig = {
    pinDigests: false,
};
function extractPackageFile(content, packageFile, config) {
    const regexMatch = regex_1.regEx(config.matchStrings[0], 'g');
    const deps = [];
    let matchResult;
    do {
        matchResult = regexMatch.exec(content);
        if (matchResult) {
            const dep = {};
            const { groups } = matchResult;
            const fields = [
                'depName',
                'lookupName',
                'currentValue',
                'currentDigest',
                'datasource',
                'versioning',
            ];
            for (const field of fields) {
                const fieldTemplate = `${field}Template`;
                if (config[fieldTemplate]) {
                    try {
                        dep[field] = template.compile(config[fieldTemplate], groups);
                    }
                    catch (err) {
                        logger_1.logger.warn({ template: config[fieldTemplate] }, 'Error compiling template for custom manager');
                        return null;
                    }
                }
                else if (groups[field]) {
                    dep[field] = groups[field];
                }
            }
            dep.replaceString = `${matchResult[0]}`;
            deps.push(dep);
        }
    } while (matchResult);
    if (deps.length) {
        return { deps, matchStrings: config.matchStrings };
    }
    return null;
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=index.js.map