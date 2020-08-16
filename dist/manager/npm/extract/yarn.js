"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getYarnLock = void 0;
const lockfile_1 = require("@yarnpkg/lockfile");
const logger_1 = require("../../../logger");
const fs_1 = require("../../../util/fs");
async function getYarnLock(filePath) {
    const yarnLockRaw = await fs_1.readLocalFile(filePath, 'utf8');
    try {
        const yarnLockParsed = lockfile_1.parse(yarnLockRaw);
        // istanbul ignore if
        if (yarnLockParsed.type !== 'success') {
            logger_1.logger.debug({ filePath, parseType: yarnLockParsed.type }, 'Error parsing yarn.lock - not success');
            return {};
        }
        const lockFile = {};
        for (const [entry, val] of Object.entries(yarnLockParsed.object)) {
            logger_1.logger.trace({ entry, version: val.version });
            lockFile[entry] = val.version;
        }
        return lockFile;
    }
    catch (err) {
        logger_1.logger.debug({ filePath, err }, 'Warning: Exception parsing yarn.lock');
        return {};
    }
}
exports.getYarnLock = getYarnLock;
//# sourceMappingURL=yarn.js.map