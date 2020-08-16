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
const datasourceHex = __importStar(require("../../datasource/hex"));
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const depSectionRegExp = /defp\s+deps.*do/g;
const depMatchRegExp = /{:(\w+),\s*([^:"]+)?:?\s*"([^"]+)",?\s*(organization: "(.*)")?.*}/gm;
function extractPackageFile(content) {
    logger_1.logger.trace('mix.extractPackageFile()');
    const deps = [];
    const contentArr = content.split('\n');
    for (let lineNumber = 0; lineNumber < contentArr.length; lineNumber += 1) {
        if (contentArr[lineNumber].match(depSectionRegExp)) {
            logger_1.logger.trace(`Matched dep section on line ${lineNumber}`);
            let depBuffer = '';
            do {
                depBuffer += contentArr[lineNumber] + '\n';
                lineNumber += 1;
            } while (!contentArr[lineNumber].includes('end'));
            let depMatch;
            do {
                depMatch = depMatchRegExp.exec(depBuffer);
                if (depMatch) {
                    const depName = depMatch[1];
                    const datasource = depMatch[2];
                    const currentValue = depMatch[3];
                    const organization = depMatch[5];
                    const dep = {
                        depName,
                        currentValue,
                        managerData: {},
                    };
                    dep.datasource = datasource || datasourceHex.id;
                    if (dep.datasource === datasourceHex.id) {
                        dep.currentValue = currentValue;
                        dep.lookupName = depName;
                    }
                    if (organization) {
                        dep.lookupName += ':' + organization;
                    }
                    if (dep.datasource !== datasourceHex.id) {
                        dep.skipReason = types_1.SkipReason.NonHexDeptypes;
                    }
                    // Find dep's line number
                    for (let i = 0; i < contentArr.length; i += 1) {
                        if (contentArr[i].includes(`:${depName},`)) {
                            dep.managerData.lineNumber = i;
                        }
                    }
                    deps.push(dep);
                }
            } while (depMatch);
        }
    }
    return { deps };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map