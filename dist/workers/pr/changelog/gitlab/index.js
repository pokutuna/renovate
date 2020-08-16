"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReleaseList = exports.getReleaseNotesMd = exports.getTags = void 0;
const changelog_filename_regex_1 = __importDefault(require("changelog-filename-regex"));
const logger_1 = require("../../../../logger");
const gitlab_1 = require("../../../../util/http/gitlab");
const url_1 = require("../../../../util/url");
const http = new gitlab_1.GitlabHttp();
function getRepoId(repository) {
    return repository.replace(/\//g, '%2f');
}
async function getTags(endpoint, repository) {
    logger_1.logger.trace('gitlab.getTags()');
    const url = `${url_1.ensureTrailingSlash(endpoint)}projects/${getRepoId(repository)}/repository/tags?per_page=100`;
    try {
        const res = await http.getJson(url, {
            paginate: true,
        });
        const tags = res.body;
        if (!tags.length) {
            logger_1.logger.debug({ sourceRepo: repository }, 'repository has no Gitlab tags');
        }
        return tags.map((tag) => tag.name).filter(Boolean);
    }
    catch (err) {
        logger_1.logger.info({ sourceRepo: repository }, 'Failed to fetch Gitlab tags');
        // istanbul ignore if
        if (err.message && err.message.includes('Bad credentials')) {
            logger_1.logger.warn('Bad credentials triggering tag fail lookup in changelog');
            throw err;
        }
        return [];
    }
}
exports.getTags = getTags;
async function getReleaseNotesMd(repository, apiBaseUrl) {
    logger_1.logger.trace('gitlab.getReleaseNotesMd()');
    const repoid = getRepoId(repository);
    const apiPrefix = `${url_1.ensureTrailingSlash(apiBaseUrl)}projects/${repoid}/repository/`;
    // https://docs.gitlab.com/13.2/ee/api/repositories.html#list-repository-tree
    let files = (await http.getJson(`${apiPrefix}tree?per_page=100`, {
        paginate: true,
    })).body;
    files = files
        .filter((f) => f.type === 'blob')
        .filter((f) => changelog_filename_regex_1.default.test(f.path));
    if (!files.length) {
        logger_1.logger.trace('no changelog file found');
        return null;
    }
    const { path: changelogFile, id } = files.shift();
    /* istanbul ignore if */
    if (files.length > 1) {
        logger_1.logger.debug(`Multiple candidates for changelog file, using ${changelogFile}`);
    }
    // https://docs.gitlab.com/13.2/ee/api/repositories.html#raw-blob-content
    const fileRes = await http.get(`${apiPrefix}blobs/${id}/raw`);
    const changelogMd = fileRes.body + '\n#\n##';
    return { changelogFile, changelogMd };
}
exports.getReleaseNotesMd = getReleaseNotesMd;
async function getReleaseList(apiBaseUrl, repository) {
    logger_1.logger.trace('gitlab.getReleaseNotesMd()');
    const repoId = getRepoId(repository);
    const apiUrl = `${url_1.ensureTrailingSlash(apiBaseUrl)}projects/${repoId}/releases`;
    const res = await http.getJson(`${apiUrl}?per_page=100`, {
        paginate: true,
    });
    return res.body.map((release) => ({
        url: `${apiUrl}/${release.tag_name}`,
        name: release.name,
        body: release.description,
        tag: release.tag_name,
    }));
}
exports.getReleaseList = getReleaseList;
//# sourceMappingURL=index.js.map