"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetCache = exports.getReleases = exports.getJenkinsPluginDependency = void 0;
const logger_1 = require("../../logger");
const external_host_error_1 = require("../../types/errors/external-host-error");
const clone_1 = require("../../util/clone");
const http_1 = require("../../util/http");
const common_1 = require("./common");
const http = new http_1.Http(common_1.id);
const packageInfoUrl = 'https://updates.jenkins.io/current/update-center.actual.json';
const packageVersionsUrl = 'https://updates.jenkins.io/current/plugin-versions.json';
function hasCacheExpired(cache) {
    const minutesElapsed = Math.floor((new Date().getTime() - cache.lastSync.getTime()) / (60 * 1000));
    return minutesElapsed >= cache.cacheTimeMin;
}
async function updateJenkinsCache(cache, updateHandler) {
    if (hasCacheExpired(cache)) {
        // eslint-disable-next-line no-param-reassign
        cache.updatePromise =
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            cache.updatePromise || updateHandler();
        await cache.updatePromise;
        cache.updatePromise = null; // eslint-disable-line no-param-reassign
    }
}
function updateJenkinsPluginInfoCacheCallback(response, cache) {
    var _a;
    for (const name of Object.keys(response.plugins || [])) {
        // eslint-disable-next-line no-param-reassign
        cache.cache[name] = {
            name,
            releases: [],
            sourceUrl: (_a = response.plugins[name]) === null || _a === void 0 ? void 0 : _a.scm,
        };
    }
}
function updateJenkinsPluginVersionsCacheCallback(response, cache) {
    const plugins = response.plugins;
    for (const name of Object.keys(plugins || [])) {
        // eslint-disable-next-line no-param-reassign
        cache.cache[name] = Object.keys(plugins[name]).map((version) => {
            var _a, _b;
            return {
                version,
                downloadUrl: (_a = plugins[name][version]) === null || _a === void 0 ? void 0 : _a.url,
                releaseTimestamp: ((_b = plugins[name][version]) === null || _b === void 0 ? void 0 : _b.buildDate) ? new Date(plugins[name][version].buildDate + ' UTC')
                    : null,
            };
        });
    }
}
async function getJenkinsUpdateCenterResponse(cache) {
    let response;
    const options = {
        headers: {
            'Accept-Encoding': 'gzip, deflate, br',
        },
    };
    try {
        logger_1.logger.debug(`jenkins-plugins: Fetching Jenkins plugns ${cache.name}`);
        const startTime = Date.now();
        response = (await http.getJson(cache.dataUrl, options)).body;
        const durationMs = Math.round(Date.now() - startTime);
        logger_1.logger.debug({ durationMs }, `jenkins-plugins: Fetched Jenkins plugins ${cache.name}`);
    }
    catch (err) /* istanbul ignore next */ {
        // eslint-disable-next-line no-param-reassign
        cache.cache = Object.create(null);
        throw new external_host_error_1.ExternalHostError(new Error(`jenkins-plugins: Fetch plugins ${cache.name} error`));
    }
    return response;
}
async function updateJenkinsPluginCache(cache, callback) {
    const response = await getJenkinsUpdateCenterResponse(cache);
    if (response) {
        callback(response, cache);
    }
    cache.lastSync = new Date(); // eslint-disable-line no-param-reassign
}
const pluginInfoCache = {
    name: 'info',
    dataUrl: packageInfoUrl,
    lastSync: new Date('2000-01-01'),
    cacheTimeMin: 1440,
    cache: Object.create(null),
};
const pluginVersionsCache = {
    name: 'versions',
    dataUrl: packageVersionsUrl,
    lastSync: new Date('2000-01-01'),
    cacheTimeMin: 60,
    cache: Object.create(null),
};
async function updateJenkinsPluginInfoCache() {
    await updateJenkinsPluginCache(pluginInfoCache, updateJenkinsPluginInfoCacheCallback);
}
async function updateJenkinsPluginVersionsCache() {
    await updateJenkinsPluginCache(pluginVersionsCache, updateJenkinsPluginVersionsCacheCallback);
}
async function getJenkinsPluginDependency(lookupName) {
    logger_1.logger.debug(`getJenkinsDependency(${lookupName})`);
    await updateJenkinsCache(pluginInfoCache, updateJenkinsPluginInfoCache);
    await updateJenkinsCache(pluginVersionsCache, updateJenkinsPluginVersionsCache);
    const plugin = pluginInfoCache.cache[lookupName];
    if (!plugin) {
        return null;
    }
    const result = clone_1.clone(plugin);
    const releases = pluginVersionsCache.cache[lookupName];
    result.releases = releases ? clone_1.clone(releases) : [];
    return result;
}
exports.getJenkinsPluginDependency = getJenkinsPluginDependency;
function getReleases({ lookupName, }) {
    return getJenkinsPluginDependency(lookupName);
}
exports.getReleases = getReleases;
function resetJenkinsCache(cache) {
    // eslint-disable-next-line no-param-reassign
    cache.lastSync = new Date('2000-01-01');
    cache.cache = Object.create(null); // eslint-disable-line no-param-reassign
}
// Note: use only for tests
function resetCache() {
    resetJenkinsCache(pluginInfoCache);
    resetJenkinsCache(pluginVersionsCache);
}
exports.resetCache = resetCache;
//# sourceMappingURL=get.js.map