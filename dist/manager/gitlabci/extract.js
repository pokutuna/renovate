"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPackageFile = void 0;
const logger_1 = require("../../logger");
const extract_1 = require("../dockerfile/extract");
function skipCommentLines(lines, lineNumber) {
    let ln = lineNumber;
    const commentsRe = /^\s*#/;
    while (ln < lines.length - 1 && commentsRe.test(lines[ln])) {
        ln += 1;
    }
    return { line: lines[ln], lineNumber: ln };
}
function extractPackageFile(content) {
    const deps = [];
    try {
        const lines = content.split('\n');
        for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
            const line = lines[lineNumber];
            const imageMatch = /^\s*image:\s*'?"?([^\s'"]+|)'?"?\s*$/.exec(line);
            if (imageMatch) {
                switch (imageMatch[1]) {
                    case '': {
                        const imageNameLine = skipCommentLines(lines, lineNumber + 1);
                        const imageNameMatch = /^\s*name:\s*'?"?([^\s'"]+|)'?"?\s*$/.exec(imageNameLine.line);
                        if (imageNameMatch) {
                            lineNumber = imageNameLine.lineNumber;
                            logger_1.logger.trace(`Matched image name on line ${lineNumber}`);
                            const currentFrom = imageNameMatch[1];
                            const dep = extract_1.getDep(currentFrom);
                            dep.depType = 'image-name';
                            deps.push(dep);
                        }
                        break;
                    }
                    default: {
                        logger_1.logger.trace(`Matched image on line ${lineNumber}`);
                        const currentFrom = imageMatch[1];
                        const dep = extract_1.getDep(currentFrom);
                        dep.depType = 'image';
                        deps.push(dep);
                    }
                }
            }
            const services = /^\s*services:\s*$/.test(line);
            if (services) {
                logger_1.logger.trace(`Matched services on line ${lineNumber}`);
                let foundImage;
                do {
                    foundImage = false;
                    const serviceImageLine = skipCommentLines(lines, lineNumber + 1);
                    logger_1.logger.trace(`serviceImageLine: "${serviceImageLine.line}"`);
                    const serviceImageMatch = /^\s*-\s*'?"?([^\s'"]+)'?"?\s*$/.exec(serviceImageLine.line);
                    if (serviceImageMatch) {
                        logger_1.logger.trace('serviceImageMatch');
                        foundImage = true;
                        const currentFrom = serviceImageMatch[1];
                        lineNumber = serviceImageLine.lineNumber;
                        const dep = extract_1.getDep(currentFrom);
                        dep.depType = 'service-image';
                        deps.push(dep);
                    }
                } while (foundImage);
            }
        }
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.warn({ err }, 'Error extracting GitLab CI dependencies');
    }
    if (!deps.length) {
        return null;
    }
    return { deps };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map