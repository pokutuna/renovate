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
const external_host_error_1 = require("../../types/errors/external-host-error");
const packageCache = __importStar(require("../../util/cache/package"));
const http_1 = require("../../util/http");
exports.id = 'galaxy';
const http = new http_1.Http(exports.id);
async function getReleases({ lookupName, }) {
    const cacheNamespace = 'datasource-galaxy';
    const cacheKey = lookupName;
    const cachedResult = await packageCache.get(cacheNamespace, cacheKey);
    // istanbul ignore if
    if (cachedResult) {
        return cachedResult;
    }
    const lookUp = lookupName.split('.');
    const userName = lookUp[0];
    const projectName = lookUp[1];
    const baseUrl = 'https://galaxy.ansible.com/';
    const galaxyAPIUrl = baseUrl +
        'api/v1/roles/?owner__username=' +
        userName +
        '&name=' +
        projectName;
    const galaxyProjectUrl = baseUrl + userName + '/' + projectName;
    try {
        let res = await http.get(galaxyAPIUrl);
        if (!res || !res.body) {
            logger_1.logger.warn({ dependency: lookupName }, `Received invalid crate data from ${galaxyAPIUrl}`);
            return null;
        }
        res = res.body;
        const response = JSON.parse(res);
        // istanbul ignore if
        if (response.results.length > 1) {
            logger_1.logger.warn({ dependency: lookupName }, `Received multiple results from ${galaxyAPIUrl}`);
            return null;
        }
        if (response.results.length === 0) {
            logger_1.logger.warn({ dependency: lookupName }, `Received no results from ${galaxyAPIUrl}`);
            return null;
        }
        const resultObject = response.results[0];
        const versions = resultObject.summary_fields.versions;
        const result = {
            releases: [],
        };
        result.dependencyUrl = galaxyProjectUrl;
        if (resultObject.github_user && resultObject.github_repo) {
            result.sourceUrl =
                'https://github.com/' +
                    resultObject.github_user +
                    '/' +
                    resultObject.github_repo;
        }
        result.releases = versions.map((version) => {
            const release = {
                version: version.name,
                releaseTimestamp: version.release_date,
            };
            return release;
        });
        const cacheMinutes = 10;
        await packageCache.set(cacheNamespace, cacheKey, result, cacheMinutes);
        return result;
    }
    catch (err) {
        if (err.statusCode === 429 ||
            (err.statusCode >= 500 && err.statusCode < 600)) {
            throw new external_host_error_1.ExternalHostError(err);
        }
        throw err;
    }
}
exports.getReleases = getReleases;
//# sourceMappingURL=index.js.map