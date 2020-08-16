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
const logger_1 = require("../../logger");
const dockerVersioning = __importStar(require("../../versioning/docker"));
const extract_1 = require("../dockerfile/extract");
function extractPackageFile(content) {
    logger_1.logger.debug('github-actions.extractPackageFile()');
    const deps = [];
    for (const line of content.split('\n')) {
        // old github actions syntax will be deprecated on September 30, 2019
        // after that, the first line can be removed
        const match = /^\s+uses = "docker:\/\/([^"]+)"\s*$/.exec(line) ||
            /^\s+uses: docker:\/\/([^"]+)\s*$/.exec(line);
        if (match) {
            const [, currentFrom] = match;
            const dep = extract_1.getDep(currentFrom);
            logger_1.logger.debug({
                depName: dep.depName,
                currentValue: dep.currentValue,
                currentDigest: dep.currentDigest,
            }, 'Docker image inside GitHub Actions');
            dep.versioning = dockerVersioning.id;
            deps.push(dep);
        }
    }
    if (!deps.length) {
        return null;
    }
    return { deps };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map