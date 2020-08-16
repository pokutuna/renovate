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
const datasourceJenkins = __importStar(require("../../datasource/jenkins-plugins"));
const logger_1 = require("../../logger");
const dockerVersioning = __importStar(require("../../versioning/docker"));
function extractPackageFile(content) {
    logger_1.logger.trace('jenkins.extractPackageFile()');
    const deps = [];
    const regex = /^\s*(?<depName>[\d\w-]+):(?<currentValue>[^#\s]+).*$/;
    for (const line of content.split('\n')) {
        const match = regex.exec(line);
        if (match) {
            const { depName, currentValue } = match.groups;
            const dep = {
                datasource: datasourceJenkins.id,
                versioning: dockerVersioning.id,
                depName,
                currentValue,
            };
            deps.push(dep);
        }
    }
    return { deps };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map