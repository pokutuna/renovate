"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReleases = exports.getDigest = exports.id = void 0;
const logger_1 = require("../../logger");
const packageCache = __importStar(require("../../util/cache/package"));
const github_1 = require("../../util/http/github");
exports.id = 'github-tags';
const http = new github_1.GithubHttp();
const cacheNamespace = 'datasource-github-tags';
function getCacheKey(repo, type) {
    return `${repo}:${type}`;
}
async function getTagCommit(githubRepo, tag) {
    const cachedResult = await packageCache.get(cacheNamespace, getCacheKey(githubRepo, `tag-${tag}`));
    // istanbul ignore if
    if (cachedResult) {
        return cachedResult;
    }
    let digest;
    try {
        const url = `https://api.github.com/repos/${githubRepo}/git/refs/tags/${tag}`;
        const res = (await http.getJson(url)).body.object;
        if (res.type === 'commit') {
            digest = res.sha;
        }
        else if (res.type === 'tag') {
            digest = (await http.getJson(res.url)).body.object.sha;
        }
        else {
            logger_1.logger.warn({ res }, 'Unknown git tag refs type');
        }
    }
    catch (err) {
        logger_1.logger.debug({ githubRepo, err }, 'Error getting tag commit from GitHub repo');
    }
    if (!digest) {
        return null;
    }
    const cacheMinutes = 120;
    await packageCache.set(cacheNamespace, getCacheKey(githubRepo, `tag-${tag}`), digest, cacheMinutes);
    return digest;
}
/**
 * github.getDigest
 *
 * The `newValue` supplied here should be a valid tag for the docker image.
 *
 * This function will simply return the latest commit hash for the configured repository.
 */
async function getDigest({ lookupName: githubRepo }, newValue) {
    if (newValue === null || newValue === void 0 ? void 0 : newValue.length) {
        return getTagCommit(githubRepo, newValue);
    }
    const cachedResult = await packageCache.get(cacheNamespace, getCacheKey(githubRepo, 'commit'));
    // istanbul ignore if
    if (cachedResult) {
        return cachedResult;
    }
    let digest;
    try {
        const url = `https://api.github.com/repos/${githubRepo}/commits?per_page=1`;
        const res = await http.getJson(url);
        digest = res.body[0].sha;
    }
    catch (err) {
        logger_1.logger.debug({ githubRepo, err }, 'Error getting latest commit from GitHub repo');
    }
    if (!digest) {
        return null;
    }
    const cacheMinutes = 10;
    await packageCache.set(cacheNamespace, getCacheKey(githubRepo, 'commit'), digest, cacheMinutes);
    return digest;
}
exports.getDigest = getDigest;
/**
 * github.getReleases
 *
 * This function can be used to fetch releases with a customisable versioning (e.g. semver) and with either tags or releases.
 *
 * This function will:
 *  - Fetch all tags or releases (depending on configuration)
 *  - Sanitize the versions if desired (e.g. strip out leading 'v')
 *  - Return a dependency object containing sourceUrl string and releases array
 */
async function getReleases({ lookupName: repo, }) {
    const cachedResult = await packageCache.get(cacheNamespace, getCacheKey(repo, 'tags'));
    // istanbul ignore if
    if (cachedResult) {
        return cachedResult;
    }
    // tag
    const url = `https://api.github.com/repos/${repo}/tags?per_page=100`;
    const versions = (await http.getJson(url, {
        paginate: true,
    })).body.map((o) => o.name);
    const dependency = {
        sourceUrl: 'https://github.com/' + repo,
        releases: null,
    };
    dependency.releases = versions.map((version) => ({
        version,
        gitRef: version,
    }));
    const cacheMinutes = 10;
    await packageCache.set(cacheNamespace, getCacheKey(repo, 'tags'), dependency, cacheMinutes);
    return dependency;
}
exports.getReleases = getReleases;
//# sourceMappingURL=index.js.map