"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreset = exports.getPresetFromEndpoint = exports.fetchJSONFile = exports.Endpoint = void 0;
const logger_1 = require("../../../logger");
const external_host_error_1 = require("../../../types/errors/external-host-error");
const gitlab_1 = require("../../../util/http/gitlab");
const util_1 = require("../util");
const gitlabApi = new gitlab_1.GitlabHttp();
exports.Endpoint = 'https://gitlab.com/api/v4/';
async function getDefaultBranchName(urlEncodedPkgName, endpoint) {
    const branchesUrl = `${endpoint}projects/${urlEncodedPkgName}/repository/branches`;
    const res = await gitlabApi.getJson(branchesUrl);
    const branches = res.body;
    let defautlBranchName = 'master';
    for (const branch of branches) {
        if (branch.default) {
            defautlBranchName = branch.name;
            break;
        }
    }
    return defautlBranchName;
}
async function fetchJSONFile(repo, fileName, endpoint) {
    try {
        const urlEncodedRepo = encodeURIComponent(repo);
        const urlEncodedPkgName = encodeURIComponent(fileName);
        const defautlBranchName = await getDefaultBranchName(urlEncodedRepo, endpoint);
        const url = `${endpoint}projects/${urlEncodedRepo}/repository/files/${urlEncodedPkgName}/raw?ref=${defautlBranchName}`;
        return (await gitlabApi.getJson(url)).body;
    }
    catch (err) {
        if (err instanceof external_host_error_1.ExternalHostError) {
            throw err;
        }
        logger_1.logger.debug({ statusCode: err.statusCode }, `Failed to retrieve ${fileName} from repo`);
        throw new Error(util_1.PRESET_DEP_NOT_FOUND);
    }
}
exports.fetchJSONFile = fetchJSONFile;
function getPresetFromEndpoint(pkgName, presetName, endpoint = exports.Endpoint) {
    return util_1.fetchPreset({
        pkgName,
        filePreset: presetName,
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