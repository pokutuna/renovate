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
const logger_1 = require("../../logger");
const packageCache = __importStar(require("../../util/cache/package"));
const http_1 = require("../../util/http");
exports.id = 'orb';
const http = new http_1.Http(exports.id);
/**
 * orb.getReleases
 *
 * This function will fetch an orb from CircleCI and return all semver versions.
 */
async function getReleases({ lookupName, }) {
    var _a;
    logger_1.logger.debug({ lookupName }, 'orb.getReleases()');
    const cacheNamespace = 'orb';
    const cacheKey = lookupName;
    const cachedResult = await packageCache.get(cacheNamespace, cacheKey);
    // istanbul ignore if
    if (cachedResult) {
        return cachedResult;
    }
    const url = 'https://circleci.com/graphql-unstable';
    const body = {
        query: `{orb(name:"${lookupName}"){name, homeUrl, versions {version, createdAt}}}`,
        variables: {},
    };
    const res = (await http.postJson(url, {
        body,
    })).body.data.orb;
    if (!res) {
        logger_1.logger.debug({ lookupName }, 'Failed to look up orb');
        return null;
    }
    // Simplify response before caching and returning
    const dep = {
        name: lookupName,
        versions: {},
        releases: null,
    };
    if ((_a = res.homeUrl) === null || _a === void 0 ? void 0 : _a.length) {
        dep.homepage = res.homeUrl;
    }
    dep.homepage =
        dep.homepage || `https://circleci.com/orbs/registry/orb/${lookupName}`;
    dep.releases = res.versions.map(({ version, createdAt }) => ({
        version,
        releaseTimestamp: createdAt || null,
    }));
    logger_1.logger.trace({ dep }, 'dep');
    const cacheMinutes = 15;
    await packageCache.set(cacheNamespace, cacheKey, dep, cacheMinutes);
    return dep;
}
exports.getReleases = getReleases;
//# sourceMappingURL=index.js.map