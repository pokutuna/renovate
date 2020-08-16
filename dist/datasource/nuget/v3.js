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
exports.getReleases = exports.getQueryUrl = exports.getDefaultFeed = void 0;
const semver = __importStar(require("semver"));
const xmldoc_1 = require("xmldoc");
const logger_1 = require("../../logger");
const packageCache = __importStar(require("../../util/cache/package"));
const http_1 = require("../../util/http");
const common_1 = require("./common");
const http = new http_1.Http(common_1.id);
// https://api.nuget.org/v3/index.json is a default official nuget feed
const defaultNugetFeed = 'https://api.nuget.org/v3/index.json';
const cacheNamespace = 'datasource-nuget';
function getDefaultFeed() {
    return defaultNugetFeed;
}
exports.getDefaultFeed = getDefaultFeed;
async function getQueryUrl(url) {
    // https://docs.microsoft.com/en-us/nuget/api/search-query-service-resource
    const resourceType = 'SearchQueryService';
    const cacheKey = `${url}:${resourceType}`;
    const cachedResult = await packageCache.get(cacheNamespace, cacheKey);
    // istanbul ignore if
    if (cachedResult) {
        return cachedResult;
    }
    try {
        // TODO: fix types
        const servicesIndexRaw = await http.getJson(url);
        const searchQueryService = servicesIndexRaw.body.resources.find((resource) => { var _a; return (_a = resource['@type']) === null || _a === void 0 ? void 0 : _a.startsWith(resourceType); });
        const searchQueryServiceId = searchQueryService['@id'];
        const cacheMinutes = 60;
        await packageCache.set(cacheNamespace, cacheKey, searchQueryServiceId, cacheMinutes);
        return searchQueryServiceId;
    }
    catch (e) {
        logger_1.logger.debug({ e }, `nuget registry failure: can't get SearchQueryService form ${url}`);
        return null;
    }
}
exports.getQueryUrl = getQueryUrl;
async function getReleases(registryUrl, feedUrl, pkgName) {
    let queryUrl = `${feedUrl}?q=${pkgName}`;
    if (registryUrl.toLowerCase() === defaultNugetFeed.toLowerCase()) {
        queryUrl = queryUrl.replace('q=', 'q=PackageId:');
        queryUrl += '&semVerLevel=2.0.0&prerelease=true';
    }
    const dep = {
        pkgName,
        releases: [],
    };
    // TODO: fix types
    const pkgUrlListRaw = await http.getJson(queryUrl);
    const match = pkgUrlListRaw.body.data.find((item) => item.id.toLowerCase() === pkgName.toLowerCase());
    // https://docs.microsoft.com/en-us/nuget/api/search-query-service-resource#search-result
    if (!match) {
        // There are no pkgName or releases in current feed
        return null;
    }
    dep.releases = match.versions.map((item) => ({
        version: item.version,
    }));
    try {
        // For nuget.org we have a way to get nuspec file
        const sanitizedVersions = dep.releases
            .map((release) => semver.valid(release.version))
            .filter(Boolean)
            .filter((version) => !semver.prerelease(version));
        let lastVersion;
        // istanbul ignore else
        if (sanitizedVersions.length) {
            // Use the last stable version we found
            lastVersion = sanitizedVersions.pop();
        }
        else {
            // Just use the last one from the list and hope for the best
            lastVersion = [...dep.releases].pop().version;
        }
        if (registryUrl.toLowerCase() === defaultNugetFeed.toLowerCase()) {
            const nugetOrgApi = `https://api.nuget.org/v3-flatcontainer/${pkgName.toLowerCase()}/${lastVersion}/${pkgName.toLowerCase()}.nuspec`;
            let metaresult;
            try {
                metaresult = await http.get(nugetOrgApi);
            }
            catch (err) /* istanbul ignore next */ {
                logger_1.logger.debug(`Cannot fetch metadata for ${pkgName} using popped version ${lastVersion}`);
                return dep;
            }
            const nuspec = new xmldoc_1.XmlDocument(metaresult.body);
            const sourceUrl = nuspec.valueWithPath('metadata.repository@url');
            if (sourceUrl) {
                dep.sourceUrl = sourceUrl;
            }
        }
        else if (match.projectUrl) {
            dep.sourceUrl = match.projectUrl;
        }
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.debug({ err, pkgName, feedUrl }, `nuget registry failure: can't parse pkg info for project url`);
    }
    return dep;
}
exports.getReleases = getReleases;
//# sourceMappingURL=v3.js.map