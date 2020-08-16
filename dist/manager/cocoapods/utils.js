"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCocoaPodsHome = void 0;
const upath_1 = require("upath");
const logger_1 = require("../../logger");
const fs_1 = require("../../util/fs");
async function getCocoaPodsHome(config) {
    const cacheDir = process.env.CP_HOME_DIR || upath_1.join(config.cacheDir, './others/cocoapods');
    await fs_1.ensureDir(cacheDir);
    logger_1.logger.debug(`Using cocoapods home ${cacheDir}`);
    return cacheDir;
}
exports.getCocoaPodsHome = getCocoaPodsHome;
//# sourceMappingURL=utils.js.map