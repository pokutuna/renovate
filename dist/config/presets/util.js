"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPreset = exports.PRESET_NOT_FOUND = exports.PRESET_DEP_NOT_FOUND = void 0;
const logger_1 = require("../../logger");
const url_1 = require("../../util/url");
exports.PRESET_DEP_NOT_FOUND = 'dep not found';
exports.PRESET_NOT_FOUND = 'preset not found';
async function fetchPreset({ pkgName, filePreset, endpoint, fetch, }) {
    // eslint-disable-next-line no-param-reassign
    endpoint = url_1.ensureTrailingSlash(endpoint);
    const [fileName, presetName, subPresetName] = filePreset.split('/');
    let jsonContent;
    if (fileName === 'default') {
        try {
            jsonContent = await fetch(pkgName, 'default.json', endpoint);
        }
        catch (err) {
            if (err.message !== exports.PRESET_DEP_NOT_FOUND) {
                throw err;
            }
            logger_1.logger.debug('default.json preset not found - trying renovate.json');
            jsonContent = await fetch(pkgName, 'renovate.json', endpoint);
        }
    }
    else {
        jsonContent = await fetch(pkgName, `${fileName}.json`, endpoint);
    }
    if (!jsonContent) {
        throw new Error(exports.PRESET_DEP_NOT_FOUND);
    }
    if (presetName) {
        const preset = jsonContent[presetName];
        if (!preset) {
            throw new Error(exports.PRESET_NOT_FOUND);
        }
        if (subPresetName) {
            const subPreset = preset[subPresetName];
            if (!subPreset) {
                throw new Error(exports.PRESET_NOT_FOUND);
            }
            return subPreset;
        }
        return preset;
    }
    return jsonContent;
}
exports.fetchPreset = fetchPreset;
//# sourceMappingURL=util.js.map