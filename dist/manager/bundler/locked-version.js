"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractLockFileEntries = void 0;
const logger_1 = require("../../logger");
const ruby_1 = require("../../versioning/ruby");
const DEP_REGEX = new RegExp('(?<=\\().*(?=\\))');
function extractLockFileEntries(lockFileContent) {
    const gemLock = new Map();
    try {
        let parsingGemSection = false;
        lockFileContent.split('\n').forEach((eachLine) => {
            const whitespace = eachLine.indexOf(eachLine.trim());
            const isGemLine = eachLine.trim().startsWith('GEM');
            if (parsingGemSection === false && whitespace === 0 && isGemLine) {
                parsingGemSection = isGemLine;
            }
            if (parsingGemSection === true && whitespace === 0 && !isGemLine) {
                parsingGemSection = false;
            }
            // as per original ruby lockfile parser,a line whitespace 2,4,6 contains dependencies.
            if (whitespace === 4 && parsingGemSection) {
                // checking if the dependency string has version or not
                const depString = DEP_REGEX.exec(eachLine);
                if (depString) {
                    const depValue = depString[0];
                    const depName = eachLine
                        .replace(depValue, '')
                        .replace('()', '')
                        .trim();
                    const isValidVersion = ruby_1.isVersion(depValue);
                    if (!gemLock.get(depName) && isValidVersion) {
                        gemLock.set(depName, depValue);
                    }
                }
            }
        });
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.error({ err }, `Failed to parse the lockfile`);
    }
    return gemLock;
}
exports.extractLockFileEntries = extractLockFileEntries;
//# sourceMappingURL=locked-version.js.map