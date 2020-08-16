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
const p_all_1 = __importDefault(require("p-all"));
const logger_1 = require("../../logger");
const external_host_error_1 = require("../../types/errors/external-host-error");
const memCache = __importStar(require("../../util/cache/memory"));
const packageCache = __importStar(require("../../util/cache/package"));
const hostRules = __importStar(require("../../util/host-rules"));
const http_1 = require("../../util/http");
exports.id = 'packagist';
exports.defaultRegistryUrls = ['https://packagist.org'];
exports.registryStrategy = 'hunt';
const http = new http_1.Http(exports.id);
// We calculate auth at this datasource layer so that we can know whether it's safe to cache or not
function getHostOpts(url) {
    const opts = {};
    const { username, password } = hostRules.find({
        hostType: exports.id,
        url,
    });
    if (username && password) {
        Object.assign(opts, { username, password });
    }
    return opts;
}
async function getRegistryMeta(regUrl) {
    const url = url_1.default.resolve(regUrl.replace(/\/?$/, '/'), 'packages.json');
    const opts = getHostOpts(url);
    const res = (await http.getJson(url, opts)).body;
    const meta = {
        providerPackages: {},
    };
    meta.packages = res.packages;
    if (res.includes) {
        meta.includesFiles = [];
        for (const [name, val] of Object.entries(res.includes)) {
            const file = {
                key: name.replace(val.sha256, '%hash%'),
                sha256: val.sha256,
            };
            meta.includesFiles.push(file);
        }
    }
    if (res['providers-url']) {
        meta.providersUrl = res['providers-url'];
    }
    if (res['provider-includes']) {
        meta.files = [];
        for (const [key, val] of Object.entries(res['provider-includes'])) {
            const file = {
                key,
                sha256: val.sha256,
            };
            meta.files.push(file);
        }
    }
    if (res.providers) {
        for (const [key, val] of Object.entries(res.providers)) {
            meta.providerPackages[key] = val.sha256;
        }
    }
    return meta;
}
async function getPackagistFile(regUrl, file) {
    var _a;
    const { key, sha256 } = file;
    const fileName = key.replace('%hash%', sha256);
    const opts = getHostOpts(regUrl);
    if (opts.password || ((_a = opts.headers) === null || _a === void 0 ? void 0 : _a.authorization)) {
        return (await http.getJson(regUrl + '/' + fileName, opts))
            .body;
    }
    const cacheNamespace = 'datasource-packagist-files';
    const cacheKey = regUrl + key;
    // Check the persistent cache for public registries
    const cachedResult = await packageCache.get(cacheNamespace, cacheKey);
    // istanbul ignore if
    if (cachedResult && cachedResult.sha256 === sha256) {
        return cachedResult.res;
    }
    const res = (await http.getJson(regUrl + '/' + fileName, opts))
        .body;
    const cacheMinutes = 1440; // 1 day
    await packageCache.set(cacheNamespace, cacheKey, { res, sha256 }, cacheMinutes);
    return res;
}
function extractDepReleases(versions) {
    const dep = { releases: null };
    // istanbul ignore if
    if (!versions) {
        dep.releases = [];
        return dep;
    }
    dep.releases = Object.keys(versions).map((version) => {
        var _a;
        const release = versions[version];
        dep.homepage = release.homepage || dep.homepage;
        if ((_a = release.source) === null || _a === void 0 ? void 0 : _a.url) {
            dep.sourceUrl = release.source.url;
        }
        return {
            version: version.replace(/^v/, ''),
            gitRef: version,
            releaseTimestamp: release.time,
        };
    });
    return dep;
}
async function getAllPackages(regUrl) {
    const registryMeta = await getRegistryMeta(regUrl);
    const { packages, providersUrl, files, includesFiles, providerPackages, } = registryMeta;
    if (files) {
        const queue = files.map((file) => () => getPackagistFile(regUrl, file));
        const resolvedFiles = await p_all_1.default(queue, { concurrency: 5 });
        for (const res of resolvedFiles) {
            for (const [name, val] of Object.entries(res.providers)) {
                providerPackages[name] = val.sha256;
            }
        }
    }
    const includesPackages = {};
    if (includesFiles) {
        for (const file of includesFiles) {
            const res = await getPackagistFile(regUrl, file);
            if (res.packages) {
                for (const [key, val] of Object.entries(res.packages)) {
                    const dep = extractDepReleases(val);
                    dep.name = key;
                    includesPackages[key] = dep;
                }
            }
        }
    }
    const allPackages = {
        packages,
        providersUrl,
        providerPackages,
        includesPackages,
    };
    return allPackages;
}
function getAllCachedPackages(regUrl) {
    const cacheKey = `packagist-${regUrl}`;
    const cachedResult = memCache.get(cacheKey);
    // istanbul ignore if
    if (cachedResult) {
        return cachedResult;
    }
    const promisedRes = getAllPackages(regUrl);
    memCache.set(cacheKey, promisedRes);
    return promisedRes;
}
async function packagistOrgLookup(name) {
    const cacheNamespace = 'datasource-packagist-org';
    const cachedResult = await packageCache.get(cacheNamespace, name);
    // istanbul ignore if
    if (cachedResult) {
        return cachedResult;
    }
    let dep = null;
    const regUrl = 'https://packagist.org';
    const pkgUrl = url_1.default.resolve(regUrl, `/p/${name}.json`);
    // TODO: fix types
    const res = (await http.getJson(pkgUrl)).body.packages[name];
    if (res) {
        dep = extractDepReleases(res);
        dep.name = name;
        logger_1.logger.trace({ dep }, 'dep');
    }
    const cacheMinutes = 10;
    await packageCache.set(cacheNamespace, name, dep, cacheMinutes);
    return dep;
}
async function packageLookup(regUrl, name) {
    try {
        if (regUrl === 'https://packagist.org') {
            const packagistResult = await packagistOrgLookup(name);
            return packagistResult;
        }
        const allPackages = await getAllCachedPackages(regUrl);
        const { packages, providersUrl, providerPackages, includesPackages, } = allPackages;
        if (packages === null || packages === void 0 ? void 0 : packages[name]) {
            const dep = extractDepReleases(packages[name]);
            dep.name = name;
            return dep;
        }
        if (includesPackages === null || includesPackages === void 0 ? void 0 : includesPackages[name]) {
            return includesPackages[name];
        }
        if (!(providerPackages === null || providerPackages === void 0 ? void 0 : providerPackages[name])) {
            return null;
        }
        const pkgUrl = url_1.default.resolve(regUrl, providersUrl
            .replace('%package%', name)
            .replace('%hash%', providerPackages[name]));
        const opts = getHostOpts(regUrl);
        // TODO: fix types
        const versions = (await http.getJson(pkgUrl, opts)).body.packages[name];
        const dep = extractDepReleases(versions);
        dep.name = name;
        logger_1.logger.trace({ dep }, 'dep');
        return dep;
    }
    catch (err) /* istanbul ignore next */ {
        if (err.host === 'packagist.org') {
            if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
                throw new external_host_error_1.ExternalHostError(err);
            }
            if (err.statusCode && err.statusCode >= 500 && err.statusCode < 600) {
                throw new external_host_error_1.ExternalHostError(err);
            }
        }
        throw err;
    }
}
function getReleases({ lookupName, registryUrl, }) {
    logger_1.logger.trace(`getReleases(${lookupName})`);
    return packageLookup(registryUrl, lookupName);
}
exports.getReleases = getReleases;
//# sourceMappingURL=index.js.map