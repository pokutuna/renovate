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
exports.getReleases = exports.getRepositoryData = exports.registryStrategy = exports.defaultRegistryUrls = exports.id = void 0;
const js_yaml_1 = __importDefault(require("js-yaml"));
const logger_1 = require("../../logger");
const external_host_error_1 = require("../../types/errors/external-host-error");
const packageCache = __importStar(require("../../util/cache/package"));
const http_1 = require("../../util/http");
const url_1 = require("../../util/url");
exports.id = 'helm';
const http = new http_1.Http(exports.id);
exports.defaultRegistryUrls = [
    'https://kubernetes-charts.storage.googleapis.com/',
];
exports.registryStrategy = 'first';
async function getRepositoryData(repository) {
    const cacheNamespace = 'datasource-helm';
    const cacheKey = repository;
    const cachedIndex = await packageCache.get(cacheNamespace, cacheKey);
    // istanbul ignore if
    if (cachedIndex) {
        return cachedIndex;
    }
    let res;
    try {
        res = await http.get('index.yaml', {
            baseUrl: url_1.ensureTrailingSlash(repository),
        });
        if (!res || !res.body) {
            logger_1.logger.warn(`Received invalid response from ${repository}`);
            return null;
        }
    }
    catch (err) {
        if (err.statusCode === 429 ||
            (err.statusCode >= 500 && err.statusCode < 600)) {
            throw new external_host_error_1.ExternalHostError(err);
        }
        throw err;
    }
    try {
        const doc = js_yaml_1.default.safeLoad(res.body, { json: true });
        if (!doc) {
            logger_1.logger.warn(`Failed to parse index.yaml from ${repository}`);
            return null;
        }
        const result = Object.entries(doc.entries).map(([k, v]) => ({
            name: k,
            homepage: v[0].home,
            sourceUrl: v[0].sources ? v[0].sources[0] : undefined,
            releases: v.map((x) => ({
                version: x.version,
                releaseTimestamp: x.created ? x.created : null,
            })),
        }));
        const cacheMinutes = 20;
        await packageCache.set(cacheNamespace, cacheKey, result, cacheMinutes);
        return result;
    }
    catch (err) {
        logger_1.logger.warn(`Failed to parse index.yaml from ${repository}`);
        logger_1.logger.debug(err);
        return null;
    }
}
exports.getRepositoryData = getRepositoryData;
async function getReleases({ lookupName, registryUrl: helmRepository, }) {
    const repositoryData = await getRepositoryData(helmRepository);
    if (!repositoryData) {
        logger_1.logger.debug(`Couldn't get index.yaml file from ${helmRepository}`);
        return null;
    }
    const releases = repositoryData.find((chart) => chart.name === lookupName);
    if (!releases) {
        logger_1.logger.debug({ dependency: lookupName }, `Entry ${lookupName} doesn't exist in index.yaml from ${helmRepository}`);
        return null;
    }
    return releases;
}
exports.getReleases = getReleases;
//# sourceMappingURL=index.js.map