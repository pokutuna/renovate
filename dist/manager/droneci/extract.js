"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPackageFile = void 0;
const logger_1 = require("../../logger");
const extract_1 = require("../dockerfile/extract");
function extractPackageFile(content) {
    const deps = [];
    try {
        const lines = content.split('\n');
        for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
            const line = lines[lineNumber];
            const match = /^\s* image:\s*'?"?([^\s'"]+)'?"?\s*$/.exec(line);
            if (match) {
                const currentFrom = match[1];
                const dep = extract_1.getDep(currentFrom);
                logger_1.logger.debug({
                    depName: dep.depName,
                    currentValue: dep.currentValue,
                    currentDigest: dep.currentDigest,
                }, 'DroneCI docker image');
                dep.depType = 'docker';
                deps.push(dep);
            }
        }
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.warn({ err }, 'Error extracting DroneCI images');
    }
    if (!deps.length) {
        return null;
    }
    return { deps };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map