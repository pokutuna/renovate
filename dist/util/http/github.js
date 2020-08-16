"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubHttp = exports.setBaseUrl = void 0;
const url_1 = __importDefault(require("url"));
const p_all_1 = __importDefault(require("p-all"));
const parse_link_header_1 = __importDefault(require("parse-link-header"));
const error_messages_1 = require("../../constants/error-messages");
const platforms_1 = require("../../constants/platforms");
const logger_1 = require("../../logger");
const external_host_error_1 = require("../../types/errors/external-host-error");
const mask_1 = require("../mask");
const _1 = require(".");
let baseUrl = 'https://api.github.com/';
exports.setBaseUrl = (url) => {
    baseUrl = url;
};
function handleGotError(err, url, opts) {
    var _a, _b, _c, _d, _e, _f;
    const path = url.toString();
    let message = err.message || '';
    if ((_a = err.body) === null || _a === void 0 ? void 0 : _a.message) {
        message = err.body.message;
    }
    if (err.name === 'RequestError' &&
        (err.code === 'ENOTFOUND' ||
            err.code === 'ETIMEDOUT' ||
            err.code === 'EAI_AGAIN')) {
        logger_1.logger.debug({ err }, 'GitHub failure: RequestError');
        throw new external_host_error_1.ExternalHostError(err, platforms_1.PLATFORM_TYPE_GITHUB);
    }
    if (err.name === 'ParseError') {
        logger_1.logger.debug({ err }, '');
        throw new external_host_error_1.ExternalHostError(err, platforms_1.PLATFORM_TYPE_GITHUB);
    }
    if (err.statusCode >= 500 && err.statusCode < 600) {
        logger_1.logger.debug({ err }, 'GitHub failure: 5xx');
        throw new external_host_error_1.ExternalHostError(err, platforms_1.PLATFORM_TYPE_GITHUB);
    }
    if (err.statusCode === 403 &&
        message.startsWith('You have triggered an abuse detection mechanism')) {
        logger_1.logger.debug({ err }, 'GitHub failure: abuse detection');
        throw new Error(error_messages_1.PLATFORM_RATE_LIMIT_EXCEEDED);
    }
    if (err.statusCode === 403 && message.includes('Upgrade to GitHub Pro')) {
        logger_1.logger.debug({ path }, 'Endpoint needs paid GitHub plan');
        throw err;
    }
    if (err.statusCode === 403 && message.includes('rate limit exceeded')) {
        logger_1.logger.debug({ err }, 'GitHub failure: rate limit');
        throw new Error(error_messages_1.PLATFORM_RATE_LIMIT_EXCEEDED);
    }
    if (err.statusCode === 403 &&
        message.startsWith('Resource not accessible by integration')) {
        logger_1.logger.debug({ err }, 'GitHub failure: Resource not accessible by integration');
        throw new Error(error_messages_1.PLATFORM_INTEGRATION_UNAUTHORIZED);
    }
    if (err.statusCode === 401 && message.includes('Bad credentials')) {
        const rateLimit = (_c = (_b = err.headers) === null || _b === void 0 ? void 0 : _b['x-ratelimit-limit']) !== null && _c !== void 0 ? _c : -1;
        logger_1.logger.debug({
            token: mask_1.maskToken(opts.token),
            err,
        }, 'GitHub failure: Bad credentials');
        if (rateLimit === '60') {
            throw new external_host_error_1.ExternalHostError(err, platforms_1.PLATFORM_TYPE_GITHUB);
        }
        throw new Error(error_messages_1.PLATFORM_BAD_CREDENTIALS);
    }
    if (err.statusCode === 422) {
        if (message.includes('Review cannot be requested from pull request author')) {
            throw err;
        }
        else if ((_e = (_d = err.body) === null || _d === void 0 ? void 0 : _d.errors) === null || _e === void 0 ? void 0 : _e.find((e) => e.code === 'invalid')) {
            throw new Error(error_messages_1.REPOSITORY_CHANGED);
        }
        logger_1.logger.debug({ err }, '422 Error thrown from GitHub');
        throw new external_host_error_1.ExternalHostError(err, platforms_1.PLATFORM_TYPE_GITHUB);
    }
    if (err.statusCode === 404) {
        logger_1.logger.debug({ url: (_f = err.options) === null || _f === void 0 ? void 0 : _f.url }, 'GitHub 404');
    }
    else {
        logger_1.logger.debug({ err }, 'Unknown GitHub error');
    }
    throw err;
}
function constructAcceptString(input) {
    const defaultAccept = 'application/vnd.github.v3+json';
    const acceptStrings = typeof input === 'string' ? input.split(/\s*,\s*/) : [];
    if (!acceptStrings.some((x) => x.startsWith('application/vnd.github.')) ||
        acceptStrings.length < 2) {
        acceptStrings.push(defaultAccept);
    }
    return acceptStrings.join(', ');
}
class GithubHttp extends _1.Http {
    constructor(options) {
        super(platforms_1.PLATFORM_TYPE_GITHUB, options);
    }
    async request(url, options, okToRetry = true) {
        var _a, _b;
        let result = null;
        const opts = {
            baseUrl,
            ...options,
            throwHttpErrors: true,
        };
        const method = opts.method || 'get';
        if (method.toLowerCase() === 'post' && url === 'graphql') {
            // GitHub Enterprise uses unversioned graphql path
            opts.baseUrl = opts.baseUrl.replace('/v3/', '/');
        }
        const accept = constructAcceptString((_a = opts.headers) === null || _a === void 0 ? void 0 : _a.accept);
        opts.headers = {
            ...opts.headers,
            accept,
        };
        try {
            result = await super.request(url, opts);
            // istanbul ignore else: Can result be null ???
            if (result !== null) {
                if (opts.paginate) {
                    // Check if result is paginated
                    const pageLimit = opts.pageLimit || 10;
                    const linkHeader = ((_b = result === null || result === void 0 ? void 0 : result.headers) === null || _b === void 0 ? void 0 : _b.link) &&
                        parse_link_header_1.default(result.headers.link);
                    if ((linkHeader === null || linkHeader === void 0 ? void 0 : linkHeader.next) && (linkHeader === null || linkHeader === void 0 ? void 0 : linkHeader.last)) {
                        let lastPage = +linkHeader.last.page;
                        // istanbul ignore else: needs a test
                        if (!process.env.RENOVATE_PAGINATE_ALL && opts.paginate !== 'all') {
                            lastPage = Math.min(pageLimit, lastPage);
                        }
                        const pageNumbers = Array.from(new Array(lastPage), (x, i) => i + 1).slice(1);
                        const queue = pageNumbers.map((page) => () => {
                            const nextUrl = url_1.default.parse(linkHeader.next.url, true);
                            delete nextUrl.search;
                            nextUrl.query.page = page.toString();
                            return this.request(url_1.default.format(nextUrl), { ...opts, paginate: false }, okToRetry);
                        });
                        const pages = await p_all_1.default(queue, { concurrency: 5 });
                        result.body = result.body.concat(...pages.filter(Boolean).map((page) => page.body));
                    }
                }
            }
        }
        catch (err) {
            handleGotError(err, url, opts);
        }
        return result;
    }
    async queryRepo(query, options = {}) {
        var _a, _b;
        let result = null;
        const path = 'graphql';
        const opts = {
            body: { query },
            headers: { accept: options === null || options === void 0 ? void 0 : options.acceptHeader },
        };
        logger_1.logger.trace(`Performing Github GraphQL request`);
        try {
            const res = await this.postJson('graphql', opts);
            result = (_b = (_a = res === null || res === void 0 ? void 0 : res.body) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.repository;
        }
        catch (gotErr) {
            handleGotError(gotErr, path, opts);
        }
        return result;
    }
    async queryRepoField(queryOrig, fieldName, options = {}) {
        const result = [];
        const regex = new RegExp(`(\\W)${fieldName}(\\s*)\\(`);
        const { paginate = true } = options;
        let count = options.count || 100;
        let cursor = null;
        let isIterating = true;
        while (isIterating) {
            let query = queryOrig;
            if (paginate) {
                let replacement = `$1${fieldName}$2(first: ${count}`;
                replacement += cursor ? `, after: "${cursor}", ` : ', ';
                query = query.replace(regex, replacement);
            }
            const gqlRes = await this.queryRepo(query, options);
            if (gqlRes === null || gqlRes === void 0 ? void 0 : gqlRes[fieldName]) {
                const { nodes = [], edges = [], pageInfo } = gqlRes[fieldName];
                result.push(...nodes);
                result.push(...edges);
                if (paginate && pageInfo) {
                    const { hasNextPage, endCursor } = pageInfo;
                    if (hasNextPage && endCursor) {
                        cursor = endCursor;
                    }
                    else {
                        isIterating = false;
                    }
                }
            }
            else {
                count = Math.floor(count / 2);
                if (count === 0) {
                    logger_1.logger.error({ gqlRes }, 'Error fetching GraphQL nodes');
                    isIterating = false;
                }
            }
            if (!paginate) {
                isIterating = false;
            }
        }
        return result;
    }
}
exports.GithubHttp = GithubHttp;
//# sourceMappingURL=github.js.map