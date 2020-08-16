"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGemHome = void 0;
const upath_1 = require("upath");
const logger_1 = require("../../logger");
const fs_1 = require("../../util/fs");
async function getGemHome(config) {
    const cacheDir = process.env.GEM_HOME || upath_1.join(config.cacheDir, './others/gem');
    await fs_1.ensureDir(cacheDir);
    logger_1.logger.debug(`Using gem home ${cacheDir}`);
    return cacheDir;
}
exports.getGemHome = getGemHome;
//# sourceMappingURL=utils.js.map