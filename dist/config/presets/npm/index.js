"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreset = void 0;
const get_1 = require("../../../datasource/npm/get");
const logger_1 = require("../../../logger");
async function getPreset({ packageName: pkgName, presetName = 'default', }) {
    const dep = await get_1.getDependency(pkgName);
    if (!dep) {
        throw new Error('dep not found');
    }
    if (!dep['renovate-config']) {
        throw new Error('preset renovate-config not found');
    }
    const presetConfig = dep['renovate-config'][presetName];
    if (!presetConfig) {
        const presetNames = Object.keys(dep['renovate-config']);
        logger_1.logger.debug({ presetNames, presetName }, 'Preset not found within renovate-config');
        throw new Error('preset not found');
    }
    return presetConfig;
}
exports.getPreset = getPreset;
//# sourceMappingURL=index.js.map