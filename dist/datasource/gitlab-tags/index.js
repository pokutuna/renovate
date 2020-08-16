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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReleases = exports.registryStrategy = exports.defaultRegistryUrls = exports.id = void 0;
const url_1 = __importDefault(require("url"));
const packageCache = __importStar(require("../../util/cache/package"));
const gitlab_1 = require("../../util/http/gitlab");
const gitlabApi = new gitlab_1.GitlabHttp();
exports.id = 'gitlab-tags';
exports.defaultRegistryUrls = ['https://gitlab.com'];
exports.registryStrategy = 'first';
const cacheNamespace = 'datasource-gitlab';
function getCacheKey(depHost, repo) {
    const type = 'tags';
    return `${depHost}:${repo}:${type}`;
}
async function getReleases({ registryUrl: depHost, lookupName: repo, }) {
    const cachedResult = await packageCache.get(cacheNamespace, getCacheKey(depHost, repo));
    // istanbul ignore if
    if (cachedResult) {
        return cachedResult;
    }
    const urlEncodedRepo = encodeURIComponent(repo);
    // tag
    const url = url_1.default.resolve(depHost, `/api/v4/projects/${urlEncodedRepo}/repository/tags?per_page=100`);
    const gitlabTags = (await gitlabApi.getJson(url, {
        paginate: true,
    })).body;
    const dependency = {
        sourceUrl: url_1.default.resolve(depHost, repo),
        releases: null,
    };
    dependency.releases = gitlabTags.map(({ name, commit }) => ({
        version: name,
        gitRef: name,
        releaseTimestamp: commit === null || commit === void 0 ? void 0 : commit.created_at,
    }));
    const cacheMinutes = 10;
    await packageCache.set(cacheNamespace, getCacheKey(depHost, repo), dependency, cacheMinutes);
    return dependency;
}
exports.getReleases = getReleases;
//# sourceMappingURL=index.js.map