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
exports.getReleases = exports.id = void 0;
const packageCache = __importStar(require("../../util/cache/package"));
const github_1 = require("../../util/http/github");
exports.id = 'github-releases';
const cacheNamespace = 'datasource-github-releases';
const http = new github_1.GithubHttp();
/**
 * github.getReleases
 *
 * This function can be used to fetch releases with a customisable versioning (e.g. semver) and with releases.
 *
 * This function will:
 *  - Fetch all releases
 *  - Sanitize the versions if desired (e.g. strip out leading 'v')
 *  - Return a dependency object containing sourceUrl string and releases array
 */
async function getReleases({ lookupName: repo, }) {
    const cachedResult = await packageCache.get(cacheNamespace, repo);
    // istanbul ignore if
    if (cachedResult) {
        return cachedResult;
    }
    const url = `https://api.github.com/repos/${repo}/releases?per_page=100`;
    const res = await http.getJson(url, {
        paginate: true,
    });
    const githubReleases = res.body;
    const dependency = {
        sourceUrl: 'https://github.com/' + repo,
        releases: null,
    };
    dependency.releases = githubReleases.map(({ tag_name, published_at }) => ({
        version: tag_name,
        gitRef: tag_name,
        releaseTimestamp: published_at,
    }));
    const cacheMinutes = 10;
    await packageCache.set(cacheNamespace, repo, dependency, cacheMinutes);
    return dependency;
}
exports.getReleases = getReleases;
//# sourceMappingURL=index.js.map