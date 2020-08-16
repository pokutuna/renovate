"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLockedVersions = void 0;
const semver_1 = require("semver");
const logger_1 = require("../../../logger");
const npm_1 = require("./npm");
const yarn_1 = require("./yarn");
async function getLockedVersions(packageFiles) {
    const lockFileCache = {};
    logger_1.logger.debug('Finding locked versions');
    for (const packageFile of packageFiles) {
        const { yarnLock, npmLock, pnpmShrinkwrap } = packageFile;
        if (yarnLock) {
            logger_1.logger.trace('Found yarnLock');
            if (!lockFileCache[yarnLock]) {
                logger_1.logger.trace('Retrieving/parsing ' + yarnLock);
                lockFileCache[yarnLock] = await yarn_1.getYarnLock(yarnLock);
            }
            for (const dep of packageFile.deps) {
                dep.lockedVersion =
                    lockFileCache[yarnLock][`${dep.depName}@${dep.currentValue}`];
            }
        }
        else if (npmLock) {
            logger_1.logger.debug('Found ' + npmLock + ' for ' + packageFile.packageFile);
            if (!lockFileCache[npmLock]) {
                logger_1.logger.trace('Retrieving/parsing ' + npmLock);
                lockFileCache[npmLock] = await npm_1.getNpmLock(npmLock);
            }
            for (const dep of packageFile.deps) {
                dep.lockedVersion = semver_1.valid(lockFileCache[npmLock][dep.depName]);
            }
        }
        else if (pnpmShrinkwrap) {
            logger_1.logger.debug('TODO: implement pnpm-lock.yaml parsing of lockVersion');
        }
    }
}
exports.getLockedVersions = getLockedVersions;
//# sourceMappingURL=locked-versions.js.map