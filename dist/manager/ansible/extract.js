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
const logger_1 = require("../../logger");
const dockerVersioning = __importStar(require("../../versioning/docker"));
const extract_1 = require("../dockerfile/extract");
function extractPackageFile(content) {
    logger_1.logger.trace('ansible.extractPackageFile()');
    let deps = [];
    const re = /^\s*image:\s*'?"?([^\s'"]+)'?"?\s*$/;
    for (const line of content.split('\n')) {
        const match = re.exec(line);
        if (match) {
            const currentFrom = match[1];
            const dep = extract_1.getDep(currentFrom);
            logger_1.logger.debug({
                depName: dep.depName,
                currentValue: dep.currentValue,
                currentDigest: dep.currentDigest,
            }, 'Docker image inside ansible');
            dep.versioning = dockerVersioning.id;
            deps.push(dep);
        }
    }
    deps = deps.filter((dep) => { var _a; return !((_a = dep.currentValue) === null || _a === void 0 ? void 0 : _a.includes('${')); });
    if (!deps.length) {
        return null;
    }
    return { deps };
}
exports.default = extractPackageFile;
//# sourceMappingURL=extract.js.map