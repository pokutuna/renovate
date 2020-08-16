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
exports.getDependency = exports.resetCache = exports.resetMemCache = void 0;
const url_1 = __importDefault(require("url"));
const is_1 = __importDefault(require("@sindresorhus/is"));
const delay_1 = __importDefault(require("delay"));
const moment_1 = __importDefault(require("moment"));
const registry_auth_token_1 = __importDefault(require("registry-auth-token"));
const registry_url_1 = __importDefault(require("registry-auth-token/registry-url"));
const logger_1 = require("../../logger");
const external_host_error_1 = require("../../types/errors/external-host-error");
const packageCache = __importStar(require("../../util/cache/package"));
const host_rules_1 = require("../../util/host-rules");
const http_1 = require("../../util/http");
const mask_1 = require("../../util/mask");
const common_1 = require("./common");
const npmrc_1 = require("./npmrc");
const http = new http_1.Http(common_1.id);
let memcache = {};
function resetMemCache() {
    logger_1.logger.debug('resetMemCache()');
    memcache = {};
}
exports.resetMemCache = resetMemCache;
function resetCache() {
    resetMemCache();
}
exports.resetCache = resetCache;
async function getDependency(packageName, retries = 3) {
    var _a, _b;
    logger_1.logger.trace(`npm.getDependency(${packageName})`);
    // This is our datastore cache and is cleared at the end of each repo, i.e. we never requery/revalidate during a "run"
    if (memcache[packageName]) {
        logger_1.logger.trace('Returning cached result');
        return JSON.parse(memcache[packageName]);
    }
    const scope = packageName.split('/')[0];
    let regUrl;
    const npmrc = npmrc_1.getNpmrc();
    try {
        regUrl = registry_url_1.default(scope, npmrc);
    }
    catch (err) {
        regUrl = 'https://registry.npmjs.org';
    }
    const pkgUrl = url_1.default.resolve(regUrl, encodeURIComponent(packageName).replace(/^%40/, '@'));
    // Now check the persistent cache
    const cacheNamespace = 'datasource-npm';
    const cachedResult = await packageCache.get(cacheNamespace, pkgUrl);
    // istanbul ignore if
    if (cachedResult) {
        return cachedResult;
    }
    const headers = {};
    let authInfo = registry_auth_token_1.default(regUrl, { npmrc, recursive: true });
    if (!authInfo &&
        npmrc &&
        npmrc._authToken &&
        regUrl.replace(/\/?$/, '/') === ((_a = npmrc.registry) === null || _a === void 0 ? void 0 : _a.replace(/\/?$/, '/'))) {
        authInfo = { type: 'Bearer', token: npmrc._authToken };
    }
    if ((authInfo === null || authInfo === void 0 ? void 0 : authInfo.type) && authInfo.token) {
        headers.authorization = `${authInfo.type} ${authInfo.token}`;
        logger_1.logger.trace({ token: mask_1.maskToken(authInfo.token), npmName: packageName }, 'Using auth (via npmrc) for npm lookup');
    }
    else if (process.env.NPM_TOKEN && process.env.NPM_TOKEN !== 'undefined') {
        logger_1.logger.trace({ token: mask_1.maskToken(process.env.NPM_TOKEN), npmName: packageName }, 'Using auth (via process.env.NPM_TOKEN) for npm lookup');
        headers.authorization = `Bearer ${process.env.NPM_TOKEN}`;
    }
    else {
        const opts = host_rules_1.find({
            hostType: 'npm',
            url: regUrl,
        });
        if (opts.token) {
            logger_1.logger.trace({ token: mask_1.maskToken(opts.token), npmName: packageName }, 'Using auth (via hostRules) for npm lookup');
            headers.authorization = `Bearer ${opts.token}`;
        }
    }
    const uri = url_1.default.parse(pkgUrl);
    if (uri.host === 'registry.npmjs.org' && !uri.pathname.startsWith('/@')) {
        // Delete the authorization header for non-scoped public packages to improve http caching
        // Otherwise, authenticated requests are not cacheable until the registry adds "public" to Cache-Control
        // Ref: https://greenbytes.de/tech/webdav/rfc7234.html#caching.authenticated.responses
        delete headers.authorization;
    }
    // This tells our http layer not to serve responses directly from the cache and instead to revalidate them every time
    headers['Cache-Control'] = 'no-cache';
    try {
        const useCache = retries === 3; // Disable cache if we're retrying
        const opts = {
            headers,
            useCache,
        };
        // TODO: fix type
        const raw = await http.getJson(pkgUrl, opts);
        if (retries < 3) {
            logger_1.logger.debug({ pkgUrl, retries }, 'Recovered from npm error');
        }
        const res = raw.body;
        // eslint-disable-next-line no-underscore-dangle
        const returnedName = res.name ? res.name : res._id || '';
        if (returnedName.toLowerCase() !== packageName.toLowerCase()) {
            logger_1.logger.warn({ lookupName: packageName, returnedName: res.name, regUrl }, 'Returned name does not match with requested name');
            return null;
        }
        if (!res.versions || !Object.keys(res.versions).length) {
            // Registry returned a 200 OK but with no versions
            logger_1.logger.debug({ dependency: packageName }, 'No versions returned');
            return null;
        }
        const latestVersion = res.versions[res['dist-tags'].latest];
        res.repository = res.repository || latestVersion.repository;
        res.homepage = res.homepage || latestVersion.homepage;
        // Determine repository URL
        let sourceUrl;
        if (res.repository) {
            if (is_1.default.string(res.repository)) {
                sourceUrl = res.repository;
            }
            else if (res.repository.url) {
                sourceUrl = res.repository.url;
            }
        }
        // Simplify response before caching and returning
        const dep = {
            name: res.name,
            homepage: res.homepage,
            latestVersion: res['dist-tags'].latest,
            sourceUrl,
            versions: {},
            releases: null,
            'dist-tags': res['dist-tags'],
            'renovate-config': latestVersion['renovate-config'],
        };
        if ((_b = res.repository) === null || _b === void 0 ? void 0 : _b.directory) {
            dep.sourceDirectory = res.repository.directory;
        }
        if (latestVersion.deprecated) {
            dep.deprecationMessage = `On registry \`${regUrl}\`, the "latest" version (v${dep.latestVersion}) of dependency \`${packageName}\` has the following deprecation notice:\n\n\`${latestVersion.deprecated}\`\n\nMarking the latest version of an npm package as deprecated results in the entire package being considered deprecated, so contact the package author you think this is a mistake.`;
            dep.deprecationSource = common_1.id;
        }
        dep.releases = Object.keys(res.versions).map((version) => {
            var _a;
            const release = {
                version,
                gitRef: res.versions[version].gitHead,
            };
            if ((_a = res.time) === null || _a === void 0 ? void 0 : _a[version]) {
                release.releaseTimestamp = res.time[version];
                release.canBeUnpublished =
                    moment_1.default().diff(moment_1.default(release.releaseTimestamp), 'days') === 0;
            }
            if (res.versions[version].deprecated) {
                release.isDeprecated = true;
            }
            return release;
        });
        logger_1.logger.trace({ dep }, 'dep');
        // serialize first before saving
        memcache[packageName] = JSON.stringify(dep);
        const cacheMinutes = process.env.RENOVATE_CACHE_NPM_MINUTES
            ? parseInt(process.env.RENOVATE_CACHE_NPM_MINUTES, 10)
            : 5;
        // TODO: use dynamic detection of public repos instead of a static list
        const whitelistedPublicScopes = [
            '@graphql-codegen',
            '@storybook',
            '@types',
            '@typescript-eslint',
        ];
        if (whitelistedPublicScopes.includes(scope) ||
            !packageName.startsWith('@')) {
            await packageCache.set(cacheNamespace, pkgUrl, dep, cacheMinutes);
        }
        return dep;
    }
    catch (err) {
        if (err.statusCode === 401 || err.statusCode === 403) {
            logger_1.logger.debug({
                pkgUrl,
                authInfoType: authInfo ? authInfo.type : undefined,
                authInfoToken: authInfo ? mask_1.maskToken(authInfo.token) : undefined,
                err,
                statusCode: err.statusCode,
                packageName,
            }, `Dependency lookup failure: unauthorized`);
            return null;
        }
        if (err.statusCode === 402) {
            logger_1.logger.debug({
                pkgUrl,
                authInfoType: authInfo ? authInfo.type : undefined,
                authInfoToken: authInfo ? mask_1.maskToken(authInfo.token) : undefined,
                err,
                statusCode: err.statusCode,
                packageName,
            }, `Dependency lookup failure: payent required`);
            return null;
        }
        if (err.statusCode === 404 || err.code === 'ENOTFOUND') {
            logger_1.logger.debug({ packageName }, `Dependency lookup failure: not found`);
            logger_1.logger.debug({
                err,
                token: authInfo ? mask_1.maskToken(authInfo.token) : 'none',
            });
            return null;
        }
        if (uri.host === 'registry.npmjs.org') {
            // istanbul ignore if
            if ((err.name === 'ParseError' ||
                err.code === 'ECONNRESET' ||
                err.code === 'ETIMEDOUT') &&
                retries > 0) {
                // Delay a random time to avoid contention
                const delaySeconds = 5 + Math.round(Math.random() * 25);
                logger_1.logger.warn({ pkgUrl, errName: err.name, delaySeconds }, 'Retrying npm error');
                await delay_1.default(1000 * delaySeconds);
                return getDependency(packageName, retries - 1);
            }
            // istanbul ignore if
            if (err.name === 'ParseError' && err.body) {
                err.body = 'err.body deleted by Renovate';
            }
            throw new external_host_error_1.ExternalHostError(err);
        }
        return null;
    }
}
exports.getDependency = getDependency;
//# sourceMappingURL=get.js.map