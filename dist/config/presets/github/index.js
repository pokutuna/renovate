"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreset = exports.getPresetFromEndpoint = exports.fetchJSONFile = exports.Endpoint = void 0;
const logger_1 = require("../../../logger");
const external_host_error_1 = require("../../../types/errors/external-host-error");
const github_1 = require("../../../util/http/github");
const util_1 = require("../util");
exports.Endpoint = 'https://api.github.com/';
const http = new github_1.GithubHttp();
async function fetchJSONFile(repo, fileName, endpoint) {
    const url = `${endpoint}repos/${repo}/contents/${fileName}`;
    let res;
    try {
        res = await http.getJson(url);
    }
    catch (err) {
        // istanbul ignore if: not testable with nock
        if (err instanceof external_host_error_1.ExternalHostError) {
            throw err;
        }
        logger_1.logger.debug({ statusCode: err.statusCode }, `Failed to retrieve ${fileName} from repo`);
        throw new Error(util_1.PRESET_DEP_NOT_FOUND);
    }
    try {
        const content = Buffer.from(res.body.content, 'base64').toString();
        const parsed = JSON.parse(content);
        return parsed;
    }
    catch (err) {
        throw new Error('invalid preset JSON');
    }
}
exports.fetchJSONFile = fetchJSONFile;
function getPresetFromEndpoint(pkgName, filePreset, endpoint = exports.Endpoint) {
    return util_1.fetchPreset({
        pkgName,
        filePreset,
        endpoint,
        fetch: fetchJSONFile,
    });
}
exports.getPresetFromEndpoint = getPresetFromEndpoint;
function getPreset({ packageName: pkgName, presetName = 'default', }) {
    return getPresetFromEndpoint(pkgName, presetName, exports.Endpoint);
}
exports.getPreset = getPreset;
//# sourceMappingURL=index.js.map