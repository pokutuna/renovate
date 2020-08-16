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
const crypto_1 = __importDefault(require("crypto"));
const error_messages_1 = require("../../constants/error-messages");
const logger_1 = require("../../logger");
const external_host_error_1 = require("../../types/errors/external-host-error");
const packageCache = __importStar(require("../../util/cache/package"));
const http_1 = require("../../util/http");
const github_1 = require("../../util/http/github");
exports.id = 'pod';
exports.defaultRegistryUrls = ['https://cdn.cocoapods.org'];
exports.registryStrategy = 'hunt';
const cacheNamespace = `datasource-${exports.id}`;
const cacheMinutes = 30;
const githubHttp = new github_1.GithubHttp();
const http = new http_1.Http(exports.id);
function shardParts(lookupName) {
    return crypto_1.default
        .createHash('md5')
        .update(lookupName)
        .digest('hex')
        .slice(0, 3)
        .split('');
}
function releasesGithubUrl(lookupName, opts) {
    const { useShard, account, repo } = opts;
    const prefix = 'https://api.github.com/repos';
    const shard = shardParts(lookupName).join('/');
    const suffix = useShard ? `${shard}/${lookupName}` : lookupName;
    return `${prefix}/${account}/${repo}/contents/Specs/${suffix}`;
}
function handleError(lookupName, err) {
    var _a;
    const errorData = { lookupName, err };
    const statusCode = (_a = err.response) === null || _a === void 0 ? void 0 : _a.statusCode;
    if (statusCode === 429 || (statusCode >= 500 && statusCode < 600)) {
        logger_1.logger.warn({ lookupName, err }, `CocoaPods registry failure`);
        throw new external_host_error_1.ExternalHostError(err);
    }
    if (statusCode === 401) {
        logger_1.logger.debug(errorData, 'Authorization error');
    }
    else if (statusCode === 404) {
        logger_1.logger.debug(errorData, 'Package lookup error');
    }
    else if (err.message === error_messages_1.HOST_DISABLED) {
        // istanbul ignore next
        logger_1.logger.trace(errorData, 'Host disabled');
    }
    else {
        logger_1.logger.warn(errorData, 'CocoaPods lookup failure: Unknown error');
    }
}
async function requestCDN(url, lookupName) {
    try {
        const resp = await http.get(url);
        if (resp === null || resp === void 0 ? void 0 : resp.body) {
            return resp.body;
        }
    }
    catch (err) {
        handleError(lookupName, err);
    }
    return null;
}
async function requestGithub(url, lookupName) {
    try {
        const resp = await githubHttp.getJson(url);
        if (resp === null || resp === void 0 ? void 0 : resp.body) {
            return resp.body;
        }
    }
    catch (err) {
        handleError(lookupName, err);
    }
    return null;
}
const githubRegex = /^https:\/\/github\.com\/(?<account>[^/]+)\/(?<repo>[^/]+?)(\.git|\/.*)?$/;
async function getReleasesFromGithub(lookupName, registryUrl, useShard = false) {
    const match = githubRegex.exec(registryUrl);
    const { account, repo } = (match === null || match === void 0 ? void 0 : match.groups) || {};
    const opts = { account, repo, useShard };
    const url = releasesGithubUrl(lookupName, opts);
    const resp = await requestGithub(url, lookupName);
    if (resp) {
        const releases = resp.map(({ name }) => ({ version: name }));
        return { releases };
    }
    if (!useShard) {
        return getReleasesFromGithub(lookupName, registryUrl, true);
    }
    return null;
}
function releasesCDNUrl(lookupName, registryUrl) {
    const shard = shardParts(lookupName).join('_');
    return `${registryUrl}/all_pods_versions_${shard}.txt`;
}
async function getReleasesFromCDN(lookupName, registryUrl) {
    const url = releasesCDNUrl(lookupName, registryUrl);
    const resp = await requestCDN(url, lookupName);
    if (resp) {
        const lines = resp.split('\n');
        for (let idx = 0; idx < lines.length; idx += 1) {
            const line = lines[idx];
            const [name, ...versions] = line.split('/');
            if (name === lookupName.replace(/\/.*$/, '')) {
                const releases = versions.map((version) => ({ version }));
                return { releases };
            }
        }
    }
    return null;
}
function isDefaultRepo(url) {
    const match = githubRegex.exec(url);
    if (match) {
        const { account, repo } = match.groups || {};
        return (account.toLowerCase() === 'cocoapods' && repo.toLowerCase() === 'specs'); // https://github.com/CocoaPods/Specs.git
    }
    return false;
}
async function getReleases({ lookupName, registryUrl, }) {
    const podName = lookupName.replace(/\/.*$/, '');
    const cachedResult = await packageCache.get(cacheNamespace, registryUrl + podName);
    // istanbul ignore if
    if (cachedResult !== undefined) {
        logger_1.logger.trace(`CocoaPods: Return cached result for ${podName}`);
        return cachedResult;
    }
    let baseUrl = registryUrl.replace(/\/+$/, '');
    // In order to not abuse github API limits, query CDN instead
    if (isDefaultRepo(baseUrl)) {
        [baseUrl] = exports.defaultRegistryUrls;
    }
    let result = null;
    if (githubRegex.exec(baseUrl)) {
        result = await getReleasesFromGithub(podName, baseUrl);
    }
    else {
        result = await getReleasesFromCDN(podName, baseUrl);
    }
    await packageCache.set(cacheNamespace, podName, result, cacheMinutes);
    return result;
}
exports.getReleases = getReleases;
//# sourceMappingURL=index.js.map