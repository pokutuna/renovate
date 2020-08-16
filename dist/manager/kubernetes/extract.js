"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPackageFile = void 0;
const logger_1 = require("../../logger");
const extract_1 = require("../dockerfile/extract");
function extractPackageFile(content) {
    logger_1.logger.trace('kubernetes.extractPackageFile()');
    let deps = [];
    const isKubernetesManifest = /\s*apiVersion\s*:/.test(content) && /\s*kind\s*:/.test(content);
    if (!isKubernetesManifest) {
        return null;
    }
    for (const line of content.split('\n')) {
        const match = /^\s*-?\s*image:\s*'?"?([^\s'"]+)'?"?\s*$/.exec(line);
        if (match) {
            const currentFrom = match[1];
            const dep = extract_1.getDep(currentFrom);
            logger_1.logger.debug({
                depName: dep.depName,
                currentValue: dep.currentValue,
                currentDigest: dep.currentDigest,
            }, 'Kubernetes image');
            deps.push(dep);
        }
    }
    deps = deps.filter((dep) => { var _a; return !((_a = dep.currentValue) === null || _a === void 0 ? void 0 : _a.includes('${')); });
    if (!deps.length) {
        return null;
    }
    return { deps };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map