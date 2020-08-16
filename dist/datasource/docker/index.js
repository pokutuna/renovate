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
exports.getReleases = exports.getDigest = exports.getRegistryRepository = exports.defaultConfig = exports.registryStrategy = exports.defaultRegistryUrls = exports.id = void 0;
const url_1 = __importDefault(require("url"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const hasha_1 = __importDefault(require("hasha"));
const parse_link_header_1 = __importDefault(require("parse-link-header"));
const www_authenticate_1 = __importDefault(require("www-authenticate"));
const error_messages_1 = require("../../constants/error-messages");
const logger_1 = require("../../logger");
const external_host_error_1 = require("../../types/errors/external-host-error");
const packageCache = __importStar(require("../../util/cache/package"));
const hostRules = __importStar(require("../../util/host-rules"));
const http_1 = require("../../util/http");
// TODO: add got typings when available
// TODO: replace www-authenticate with https://www.npmjs.com/package/auth-header ?
exports.id = 'docker';
exports.defaultRegistryUrls = ['https://index.docker.io'];
exports.registryStrategy = 'first';
exports.defaultConfig = {
    managerBranchPrefix: 'docker-',
    commitMessageTopic: '{{{depName}}} Docker tag',
    major: { enabled: false },
    commitMessageExtra: 'to v{{#if isMajor}}{{{newMajor}}}{{else}}{{{newVersion}}}{{/if}}',
    digest: {
        branchTopic: '{{{depNameSanitized}}}-{{{currentValue}}}',
        commitMessageExtra: 'to {{newDigestShort}}',
        commitMessageTopic: '{{{depName}}}{{#if currentValue}}:{{{currentValue}}}{{/if}} Docker digest',
        group: {
            commitMessageTopic: '{{{groupName}}}',
            commitMessageExtra: '',
        },
    },
    pin: {
        commitMessageExtra: '',
        groupName: 'Docker digests',
        group: {
            commitMessageTopic: '{{{groupName}}}',
            branchTopic: 'digests-pin',
        },
    },
    group: {
        commitMessageTopic: '{{{groupName}}} Docker tags',
    },
};
const http = new http_1.Http(exports.id);
const ecrRegex = /\d+\.dkr\.ecr\.([-a-z0-9]+)\.amazonaws\.com/;
function getRegistryRepository(lookupName, registryUrl) {
    if (registryUrl !== exports.defaultRegistryUrls[0]) {
        const dockerRegistry = registryUrl
            .replace('https://', '')
            .replace(/\/?$/, '/');
        if (lookupName.startsWith(dockerRegistry)) {
            return {
                registry: dockerRegistry,
                repository: lookupName.replace(dockerRegistry, ''),
            };
        }
    }
    let registry;
    const split = lookupName.split('/');
    if (split.length > 1 && (split[0].includes('.') || split[0].includes(':'))) {
        [registry] = split;
        split.shift();
    }
    let repository = split.join('/');
    if (!registry) {
        registry = registryUrl;
    }
    if (registry === 'docker.io') {
        registry = 'index.docker.io';
    }
    if (!/^https?:\/\//.exec(registry)) {
        registry = `https://${registry}`;
    }
    const opts = hostRules.find({ hostType: exports.id, url: registry });
    if (opts === null || opts === void 0 ? void 0 : opts.insecureRegistry) {
        registry = registry.replace('https', 'http');
    }
    if (registry.endsWith('.docker.io') && !repository.includes('/')) {
        repository = 'library/' + repository;
    }
    return {
        registry,
        repository,
    };
}
exports.getRegistryRepository = getRegistryRepository;
function getECRAuthToken(region, opts) {
    const config = { region, accessKeyId: undefined, secretAccessKey: undefined };
    if (opts.username && opts.password) {
        config.accessKeyId = opts.username;
        config.secretAccessKey = opts.password;
    }
    const ecr = new aws_sdk_1.default.ECR(config);
    return new Promise((resolve) => {
        ecr.getAuthorizationToken({}, (err, data) => {
            var _a, _b;
            if (err) {
                logger_1.logger.trace({ err }, 'err');
                logger_1.logger.debug('ECR getAuthorizationToken error');
                resolve(null);
            }
            else {
                const authorizationToken = (_b = (_a = data === null || data === void 0 ? void 0 : data.authorizationData) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.authorizationToken;
                if (authorizationToken) {
                    resolve(authorizationToken);
                }
                else {
                    logger_1.logger.warn('Could not extract authorizationToken from ECR getAuthorizationToken response');
                    resolve(null);
                }
            }
        });
    });
}
async function getAuthHeaders(registry, repository) {
    try {
        const apiCheckUrl = `${registry}/v2/`;
        const apiCheckResponse = await http.get(apiCheckUrl, {
            throwHttpErrors: false,
        });
        if (apiCheckResponse.headers['www-authenticate'] === undefined) {
            return {};
        }
        const authenticateHeader = new www_authenticate_1.default.parsers.WWW_Authenticate(apiCheckResponse.headers['www-authenticate']);
        const opts = hostRules.find({ hostType: exports.id, url: apiCheckUrl });
        if (ecrRegex.test(registry)) {
            const [, region] = ecrRegex.exec(registry);
            const auth = await getECRAuthToken(region, opts);
            if (auth) {
                opts.headers = { authorization: `Basic ${auth}` };
            }
        }
        else if (opts.username && opts.password) {
            const auth = Buffer.from(`${opts.username}:${opts.password}`).toString('base64');
            opts.headers = { authorization: `Basic ${auth}` };
        }
        delete opts.username;
        delete opts.password;
        if (authenticateHeader.scheme.toUpperCase() === 'BASIC') {
            logger_1.logger.debug(`Using Basic auth for docker registry ${repository}`);
            await http.get(apiCheckUrl, opts);
            return opts.headers;
        }
        // prettier-ignore
        const authUrl = `${authenticateHeader.parms.realm}?service=${authenticateHeader.parms.service}&scope=repository:${repository}:pull`;
        logger_1.logger.trace(`Obtaining docker registry token for ${repository} using url ${authUrl}`);
        const authResponse = (await http.getJson(authUrl, opts)).body;
        const token = authResponse.token || authResponse.access_token;
        // istanbul ignore if
        if (!token) {
            logger_1.logger.warn('Failed to obtain docker registry token');
            return null;
        }
        return {
            authorization: `Bearer ${token}`,
        };
    }
    catch (err) /* istanbul ignore next */ {
        if (err.host === 'quay.io') {
            // TODO: debug why quay throws errors
            return null;
        }
        if (err.statusCode === 401) {
            logger_1.logger.debug({ registry, dockerRepository: repository }, 'Unauthorized docker lookup');
            logger_1.logger.debug({ err });
            return null;
        }
        if (err.statusCode === 403) {
            logger_1.logger.debug({ registry, dockerRepository: repository }, 'Not allowed to access docker registry');
            logger_1.logger.debug({ err });
            return null;
        }
        // prettier-ignore
        if (err.name === 'RequestError' && registry.endsWith('docker.io')) { // lgtm [js/incomplete-url-substring-sanitization]
            throw new external_host_error_1.ExternalHostError(err);
        }
        // prettier-ignore
        if (err.statusCode === 429 && registry.endsWith('docker.io')) { // lgtm [js/incomplete-url-substring-sanitization]
            throw new external_host_error_1.ExternalHostError(err);
        }
        if (err.statusCode >= 500 && err.statusCode < 600) {
            throw new external_host_error_1.ExternalHostError(err);
        }
        if (err.message === error_messages_1.HOST_DISABLED) {
            logger_1.logger.trace({ registry, dockerRepository: repository, err }, 'Host disabled');
            return null;
        }
        logger_1.logger.warn({ registry, dockerRepository: repository, err }, 'Error obtaining docker token');
        return null;
    }
}
function digestFromManifestStr(str) {
    return 'sha256:' + hasha_1.default(str, { algorithm: 'sha256' });
}
function extractDigestFromResponse(manifestResponse) {
    if (manifestResponse.headers['docker-content-digest'] === undefined) {
        return digestFromManifestStr(manifestResponse.body);
    }
    return manifestResponse.headers['docker-content-digest'];
}
async function getManifestResponse(registry, repository, tag) {
    logger_1.logger.debug(`getManifestResponse(${registry}, ${repository}, ${tag})`);
    try {
        const headers = await getAuthHeaders(registry, repository);
        if (!headers) {
            logger_1.logger.debug('No docker auth found - returning');
            return null;
        }
        headers.accept = 'application/vnd.docker.distribution.manifest.v2+json';
        const url = `${registry}/v2/${repository}/manifests/${tag}`;
        const manifestResponse = await http.get(url, {
            headers,
        });
        return manifestResponse;
    }
    catch (err) /* istanbul ignore next */ {
        if (err instanceof external_host_error_1.ExternalHostError) {
            throw err;
        }
        if (err.statusCode === 401) {
            logger_1.logger.debug({ registry, dockerRepository: repository }, 'Unauthorized docker lookup');
            logger_1.logger.debug({ err });
            return null;
        }
        if (err.statusCode === 404) {
            logger_1.logger.debug({
                err,
                registry,
                dockerRepository: repository,
                tag,
            }, 'Docker Manifest is unknown');
            return null;
        }
        // prettier-ignore
        if (err.statusCode === 429 && registry.endsWith('docker.io')) { // lgtm [js/incomplete-url-substring-sanitization]
            throw new external_host_error_1.ExternalHostError(err);
        }
        if (err.statusCode >= 500 && err.statusCode < 600) {
            throw new external_host_error_1.ExternalHostError(err);
        }
        if (err.code === 'ETIMEDOUT') {
            logger_1.logger.debug({ registry }, 'Timeout when attempting to connect to docker registry');
            logger_1.logger.debug({ err });
            return null;
        }
        logger_1.logger.debug({
            err,
            registry,
            dockerRepository: repository,
            tag,
        }, 'Unknown Error looking up docker manifest');
        return null;
    }
}
/**
 * docker.getDigest
 *
 * The `newValue` supplied here should be a valid tag for the docker image.
 *
 * This function will:
 *  - Look up a sha256 digest for a tag on its registry
 *  - Return the digest as a string
 */
async function getDigest({ registryUrl, lookupName }, newValue) {
    const { registry, repository } = getRegistryRepository(lookupName, registryUrl);
    logger_1.logger.debug(`getDigest(${registry}, ${repository}, ${newValue})`);
    const newTag = newValue || 'latest';
    const cacheNamespace = 'datasource-docker-digest';
    const cacheKey = `${registry}:${repository}:${newTag}`;
    let digest = null;
    try {
        const cachedResult = await packageCache.get(cacheNamespace, cacheKey);
        // istanbul ignore if
        if (cachedResult !== undefined) {
            return cachedResult;
        }
        const manifestResponse = await getManifestResponse(registry, repository, newTag);
        if (manifestResponse) {
            digest = extractDigestFromResponse(manifestResponse) || null;
            logger_1.logger.debug({ digest }, 'Got docker digest');
        }
    }
    catch (err) /* istanbul ignore next */ {
        if (err instanceof external_host_error_1.ExternalHostError) {
            throw err;
        }
        logger_1.logger.debug({
            err,
            lookupName,
            newTag,
        }, 'Unknown Error looking up docker image digest');
    }
    const cacheMinutes = 30;
    await packageCache.set(cacheNamespace, cacheKey, digest, cacheMinutes);
    return digest;
}
exports.getDigest = getDigest;
async function getTags(registry, repository) {
    let tags = [];
    try {
        const cacheNamespace = 'datasource-docker-tags';
        const cacheKey = `${registry}:${repository}`;
        const cachedResult = await packageCache.get(cacheNamespace, cacheKey);
        // istanbul ignore if
        if (cachedResult !== undefined) {
            return cachedResult;
        }
        // AWS ECR limits the maximum number of results to 1000
        // See https://docs.aws.amazon.com/AmazonECR/latest/APIReference/API_DescribeRepositories.html#ECR-DescribeRepositories-request-maxResults
        const limit = ecrRegex.test(registry) ? 1000 : 10000;
        let url = `${registry}/v2/${repository}/tags/list?n=${limit}`;
        const headers = await getAuthHeaders(registry, repository);
        if (!headers) {
            logger_1.logger.debug('Failed to get authHeaders for getTags lookup');
            return null;
        }
        let page = 1;
        do {
            const res = await http.getJson(url, { headers });
            tags = tags.concat(res.body.tags);
            const linkHeader = parse_link_header_1.default(res.headers.link);
            url = (linkHeader === null || linkHeader === void 0 ? void 0 : linkHeader.next) ? url_1.default.resolve(url, linkHeader.next.url) : null;
            page += 1;
        } while (url && page < 20);
        const cacheMinutes = 15;
        await packageCache.set(cacheNamespace, cacheKey, tags, cacheMinutes);
        return tags;
    }
    catch (err) /* istanbul ignore next */ {
        if (err instanceof external_host_error_1.ExternalHostError) {
            throw err;
        }
        if (err.statusCode === 404 && !repository.includes('/')) {
            logger_1.logger.debug(`Retrying Tags for ${registry}/${repository} using library/ prefix`);
            return getTags(registry, 'library/' + repository);
        }
        // prettier-ignore
        if (err.statusCode === 429 && registry.endsWith('docker.io')) { // lgtm [js/incomplete-url-substring-sanitization]
            logger_1.logger.warn({ registry, dockerRepository: repository, err }, 'docker registry failure: too many requests');
            throw new external_host_error_1.ExternalHostError(err);
        }
        if (err.statusCode >= 500 && err.statusCode < 600) {
            logger_1.logger.warn({ registry, dockerRepository: repository, err }, 'docker registry failure: internal error');
            throw new external_host_error_1.ExternalHostError(err);
        }
        throw err;
    }
}
/*
 * docker.getLabels
 *
 * This function will:
 *  - Return the labels for the requested image
 */
async function getLabels(registry, repository, tag) {
    logger_1.logger.debug(`getLabels(${registry}, ${repository}, ${tag})`);
    const cacheNamespace = 'datasource-docker-labels';
    const cacheKey = `${registry}:${repository}:${tag}`;
    const cachedResult = await packageCache.get(cacheNamespace, cacheKey);
    // istanbul ignore if
    if (cachedResult !== undefined) {
        return cachedResult;
    }
    try {
        const manifestResponse = await getManifestResponse(registry, repository, tag);
        // If getting the manifest fails here, then abort
        // This means that the latest tag doesn't have a manifest, which shouldn't
        // be possible
        // istanbul ignore if
        if (!manifestResponse) {
            logger_1.logger.debug({
                registry,
                dockerRepository: repository,
                tag,
            }, 'docker registry failure: failed to get manifest for tag');
            return {};
        }
        const manifest = JSON.parse(manifestResponse.body);
        // istanbul ignore if
        if (manifest.schemaVersion !== 2) {
            logger_1.logger.debug({ registry, dockerRepository: repository, tag }, 'Manifest schema version is not 2');
            return {};
        }
        let labels = {};
        const configDigest = manifest.config.digest;
        const headers = await getAuthHeaders(registry, repository);
        // istanbul ignore if: Should never be happen
        if (!headers) {
            logger_1.logger.debug('No docker auth found - returning');
            return {};
        }
        const url = `${registry}/v2/${repository}/blobs/${configDigest}`;
        const configResponse = await http.get(url, {
            headers,
        });
        labels = JSON.parse(configResponse.body).config.Labels;
        if (labels) {
            logger_1.logger.debug({
                labels,
            }, 'found labels in manifest');
        }
        const cacheMinutes = 60;
        await packageCache.set(cacheNamespace, cacheKey, labels, cacheMinutes);
        return labels;
    }
    catch (err) /* istanbul ignore next: should be tested in future */ {
        if (err instanceof external_host_error_1.ExternalHostError) {
            throw err;
        }
        if (err.statusCode === 400 || err.statusCode === 401) {
            logger_1.logger.debug({ registry, dockerRepository: repository, err }, 'Unauthorized docker lookup');
        }
        else if (err.statusCode === 404) {
            logger_1.logger.warn({
                err,
                registry,
                dockerRepository: repository,
                tag,
            }, 'Config Manifest is unknown');
        }
        else if (err.statusCode === 429 &&
            registry.endsWith('docker.io') // lgtm [js/incomplete-url-substring-sanitization]
        ) {
            logger_1.logger.warn({ err }, 'docker registry failure: too many requests');
        }
        else if (err.statusCode >= 500 && err.statusCode < 600) {
            logger_1.logger.debug({
                err,
                registry,
                dockerRepository: repository,
                tag,
            }, 'docker registry failure: internal error');
        }
        else if (err.code === 'ERR_TLS_CERT_ALTNAME_INVALID' ||
            err.code === 'ETIMEDOUT') {
            logger_1.logger.debug({ registry, err }, 'Error connecting to docker registry');
        }
        else if (registry === 'https://quay.io') {
            // istanbul ignore next
            logger_1.logger.debug('Ignoring quay.io errors until they fully support v2 schema');
        }
        else {
            logger_1.logger.info({ registry, dockerRepository: repository, tag, err }, 'Unknown error getting Docker labels');
        }
        return {};
    }
}
/**
 * docker.getReleases
 *
 * A docker image usually looks something like this: somehost.io/owner/repo:8.1.0-alpine
 * In the above:
 *  - 'somehost.io' is the registry
 *  - 'owner/repo' is the package name
 *  - '8.1.0-alpine' is the tag
 *
 * This function will filter only tags that contain a semver version
 */
async function getReleases({ lookupName, registryUrl, }) {
    const { registry, repository } = getRegistryRepository(lookupName, registryUrl);
    const tags = await getTags(registry, repository);
    if (!tags) {
        return null;
    }
    const releases = tags.map((version) => ({ version }));
    const ret = {
        dockerRegistry: registry,
        dockerRepository: repository,
        releases,
    };
    const latestTag = tags.includes('latest') ? 'latest' : tags[tags.length - 1];
    const labels = await getLabels(registry, repository, latestTag);
    if (labels && 'org.opencontainers.image.source' in labels) {
        ret.sourceUrl = labels['org.opencontainers.image.source'];
    }
    return ret;
}
exports.getReleases = getReleases;
//# sourceMappingURL=index.js.map