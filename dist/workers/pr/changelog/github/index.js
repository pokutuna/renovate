"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReleaseList = exports.getReleaseNotesMd = exports.getTags = void 0;
const changelog_filename_regex_1 = __importDefault(require("changelog-filename-regex"));
const logger_1 = require("../../../../logger");
const github_1 = require("../../../../util/http/github");
const url_1 = require("../../../../util/url");
const http = new github_1.GithubHttp();
async function getTags(endpoint, repository) {
    logger_1.logger.trace('github.getTags()');
    const url = `${endpoint}repos/${repository}/tags?per_page=100`;
    try {
        const res = await http.getJson(url, {
            paginate: true,
        });
        const tags = res.body;
        if (!tags.length) {
            logger_1.logger.debug({ repository }, 'repository has no Github tags');
        }
        return tags.map((tag) => tag.name).filter(Boolean);
    }
    catch (err) {
        logger_1.logger.debug({ sourceRepo: repository }, 'Failed to fetch Github tags');
        logger_1.logger.debug({ err });
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
    logger_1.logger.trace('github.getReleaseNotesMd()');
    const apiPrefix = `${url_1.ensureTrailingSlash(apiBaseUrl)}repos/${repository}`;
    const { default_branch = 'master' } = (await http.getJson(apiPrefix)).body;
    // https://docs.github.com/en/rest/reference/git#get-a-tree
    const res = await http.getJson(`${apiPrefix}/git/trees/${default_branch}`);
    // istanbul ignore if
    if (res.body.truncated) {
        logger_1.logger.debug({ repository }, 'Git tree truncated');
    }
    const files = res.body.tree
        .filter((f) => f.type === 'blob')
        .filter((f) => changelog_filename_regex_1.default.test(f.path));
    if (!files.length) {
        logger_1.logger.trace('no changelog file found');
        return null;
    }
    const { path: changelogFile, sha } = files.shift();
    /* istanbul ignore if */
    if (files.length > 1) {
        logger_1.logger.debug(`Multiple candidates for changelog file, using ${changelogFile}`);
    }
    // https://docs.github.com/en/rest/reference/git#get-a-blob
    const fileRes = await http.getJson(`${apiPrefix}/git/blobs/${sha}`);
    const changelogMd = Buffer.from(fileRes.body.content, 'base64').toString() + '\n#\n##';
    return { changelogFile, changelogMd };
}
exports.getReleaseNotesMd = getReleaseNotesMd;
async function getReleaseList(apiBaseUrl, repository) {
    logger_1.logger.trace('github.getReleaseList()');
    const url = `${url_1.ensureTrailingSlash(apiBaseUrl)}repos/${repository}/releases?per_page=100`;
    const res = await http.getJson(url, { paginate: true });
    return res.body.map((release) => ({
        url: release.html_url,
        id: release.id,
        tag: release.tag_name,
        name: release.name,
        body: release.body,
    }));
}
exports.getReleaseList = getReleaseList;
//# sourceMappingURL=index.js.map