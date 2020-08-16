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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultConfig = exports.getDigest = exports.supportsDigests = exports.getPkgReleases = exports.getDatasourceList = exports.getDatasources = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const fast_deep_equal_1 = __importDefault(require("fast-deep-equal"));
const error_messages_1 = require("../constants/error-messages");
const logger_1 = require("../logger");
const external_host_error_1 = require("../types/errors/external-host-error");
const memCache = __importStar(require("../util/cache/memory"));
const clone_1 = require("../util/clone");
const allVersioning = __importStar(require("../versioning"));
const api_generated_1 = __importDefault(require("./api.generated"));
const metadata_1 = require("./metadata");
__exportStar(require("./common"), exports);
exports.getDatasources = () => api_generated_1.default;
exports.getDatasourceList = () => Array.from(api_generated_1.default.keys());
const cacheNamespace = 'datasource-releases';
function load(datasource) {
    return api_generated_1.default.get(datasource);
}
function logError(datasource, lookupName, err) {
    const { statusCode, code: errCode, url } = err;
    if (statusCode === 404) {
        logger_1.logger.debug({ datasource, lookupName, url }, 'Datasource 404');
    }
    else if (statusCode === 401 || statusCode === 403) {
        logger_1.logger.debug({ datasource, lookupName, url }, 'Datasource unauthorized');
    }
    else if (errCode) {
        logger_1.logger.debug({ datasource, lookupName, url, errCode }, 'Datasource connection error');
    }
    else {
        logger_1.logger.debug({ datasource, lookupName, err }, 'Datasource unknown error');
    }
}
async function getRegistryReleases(datasource, config, registryUrl) {
    const res = await datasource.getReleases({ ...config, registryUrl });
    return res;
}
function firstRegistry(config, datasource, registryUrls) {
    if (registryUrls.length > 1) {
        logger_1.logger.warn({ datasource: datasource.id, depName: config.depName, registryUrls }, 'Excess registryUrls found for datasource lookup - using first configured only');
    }
    const registryUrl = registryUrls[0];
    return getRegistryReleases(datasource, config, registryUrl);
}
async function huntRegistries(config, datasource, registryUrls) {
    let res;
    let caughtError;
    for (const registryUrl of registryUrls) {
        try {
            res = await getRegistryReleases(datasource, config, registryUrl);
            if (res) {
                break;
            }
        }
        catch (err) {
            if (err instanceof external_host_error_1.ExternalHostError) {
                throw err;
            }
            // We'll always save the last-thrown error
            caughtError = err;
            logger_1.logger.trace({ err }, 'datasource hunt failure');
        }
    }
    if (res) {
        return res;
    }
    if (caughtError) {
        throw caughtError;
    }
    return null;
}
async function mergeRegistries(config, datasource, registryUrls) {
    var _a;
    let combinedRes;
    let caughtError;
    for (const registryUrl of registryUrls) {
        try {
            const res = await getRegistryReleases(datasource, config, registryUrl);
            if (combinedRes) {
                combinedRes = { ...res, ...combinedRes };
                combinedRes.releases = [...combinedRes.releases, ...res.releases];
            }
            else {
                combinedRes = res;
            }
        }
        catch (err) {
            if (err instanceof external_host_error_1.ExternalHostError) {
                throw err;
            }
            // We'll always save the last-thrown error
            caughtError = err;
            logger_1.logger.trace({ err }, 'datasource merge failure');
        }
    }
    // De-duplicate releases
    if ((_a = combinedRes === null || combinedRes === void 0 ? void 0 : combinedRes.releases) === null || _a === void 0 ? void 0 : _a.length) {
        const seenVersions = new Set();
        combinedRes.releases = combinedRes.releases.filter((release) => {
            if (seenVersions.has(release.version)) {
                return false;
            }
            seenVersions.add(release.version);
            return true;
        });
    }
    if (combinedRes) {
        return combinedRes;
    }
    if (caughtError) {
        throw caughtError;
    }
    return null;
}
function resolveRegistryUrls(datasource, extractedUrls) {
    const { defaultRegistryUrls = [], appendRegistryUrls = [] } = datasource;
    const customUrls = extractedUrls === null || extractedUrls === void 0 ? void 0 : extractedUrls.filter(Boolean);
    let registryUrls;
    if (is_1.default.nonEmptyArray(customUrls)) {
        registryUrls = [...extractedUrls, ...appendRegistryUrls];
    }
    else {
        registryUrls = [...defaultRegistryUrls, ...appendRegistryUrls];
    }
    return registryUrls.filter(Boolean);
}
async function fetchReleases(config) {
    var _a;
    const { datasource: datasourceName } = config;
    if (!datasourceName || !api_generated_1.default.has(datasourceName)) {
        logger_1.logger.warn('Unknown datasource: ' + datasourceName);
        return null;
    }
    const datasource = load(datasourceName);
    const registryUrls = resolveRegistryUrls(datasource, config.registryUrls);
    let dep = null;
    try {
        if (datasource.registryStrategy) {
            // istanbul ignore if
            if (!registryUrls.length) {
                logger_1.logger.warn({ datasource: datasourceName, depName: config.depName }, 'Missing registryUrls for registryStrategy');
                return null;
            }
            if (datasource.registryStrategy === 'first') {
                dep = await firstRegistry(config, datasource, registryUrls);
            }
            else if (datasource.registryStrategy === 'hunt') {
                dep = await huntRegistries(config, datasource, registryUrls);
            }
            else if (datasource.registryStrategy === 'merge') {
                dep = await mergeRegistries(config, datasource, registryUrls);
            }
        }
        else {
            dep = await datasource.getReleases({
                ...config,
                registryUrls,
            });
        }
    }
    catch (err) {
        if (err.message === error_messages_1.HOST_DISABLED || ((_a = err.err) === null || _a === void 0 ? void 0 : _a.message) === error_messages_1.HOST_DISABLED) {
            return null;
        }
        if (err instanceof external_host_error_1.ExternalHostError) {
            throw err;
        }
        logError(datasource.id, config.lookupName, err);
    }
    if (!dep || fast_deep_equal_1.default(dep, { releases: [] })) {
        return null;
    }
    metadata_1.addMetaData(dep, datasourceName, config.lookupName);
    return dep;
}
function getRawReleases(config) {
    const cacheKey = cacheNamespace +
        config.datasource +
        config.lookupName +
        config.registryUrls;
    // By returning a Promise and reusing it, we should only fetch each package at most once
    const cachedResult = memCache.get(cacheKey);
    // istanbul ignore if
    if (cachedResult) {
        return cachedResult;
    }
    const promisedRes = fetchReleases(config);
    memCache.set(cacheKey, promisedRes);
    return promisedRes;
}
async function getPkgReleases(config) {
    if (!config.datasource) {
        logger_1.logger.warn('No datasource found');
        return null;
    }
    const lookupName = config.lookupName || config.depName;
    if (!lookupName) {
        logger_1.logger.error({ config }, 'Datasource getReleases without lookupName');
        return null;
    }
    let res;
    try {
        res = clone_1.clone(await getRawReleases({
            ...config,
            lookupName,
        }));
    }
    catch (e) /* istanbul ignore next */ {
        if (e instanceof external_host_error_1.ExternalHostError) {
            e.hostType = config.datasource;
            e.lookupName = lookupName;
        }
        throw e;
    }
    if (!res) {
        return res;
    }
    // Filter by versioning
    const version = allVersioning.get(config.versioning);
    // Return a sorted list of valid Versions
    function sortReleases(release1, release2) {
        return version.sortVersions(release1.version, release2.version);
    }
    if (res.releases) {
        res.releases = res.releases
            .filter((release) => version.isVersion(release.version))
            .sort(sortReleases);
    }
    return res;
}
exports.getPkgReleases = getPkgReleases;
function supportsDigests(config) {
    return 'getDigest' in load(config.datasource);
}
exports.supportsDigests = supportsDigests;
function getDigest(config, value) {
    const datasource = load(config.datasource);
    const lookupName = config.lookupName || config.depName;
    const registryUrls = resolveRegistryUrls(datasource, config.registryUrls);
    return datasource.getDigest({ lookupName, registryUrl: registryUrls[0] }, value);
}
exports.getDigest = getDigest;
function getDefaultConfig(datasource) {
    const loadedDatasource = load(datasource);
    return Promise.resolve((loadedDatasource === null || loadedDatasource === void 0 ? void 0 : loadedDatasource.defaultConfig) || {});
}
exports.getDefaultConfig = getDefaultConfig;
//# sourceMappingURL=index.js.map