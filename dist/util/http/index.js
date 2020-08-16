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
exports.Http = void 0;
const crypto_1 = __importDefault(require("crypto"));
const url_1 = __importDefault(require("url"));
const got_1 = __importDefault(require("got"));
const error_messages_1 = require("../../constants/error-messages");
const external_host_error_1 = require("../../types/errors/external-host-error");
const memCache = __importStar(require("../cache/memory"));
const clone_1 = require("../clone");
const auth_1 = require("./auth");
const host_rules_1 = require("./host-rules");
// TODO: refactor code to remove this
require("./legacy");
__exportStar(require("./types"), exports);
function cloneResponse(response) {
    // clone body and headers so that the cached result doesn't get accidentally mutated
    return {
        body: clone_1.clone(response.body),
        headers: clone_1.clone(response.headers),
    };
}
async function resolveResponse(promisedRes, { abortOnError, abortIgnoreStatusCodes }) {
    try {
        const res = await promisedRes;
        return cloneResponse(res);
    }
    catch (err) {
        if (abortOnError && !(abortIgnoreStatusCodes === null || abortIgnoreStatusCodes === void 0 ? void 0 : abortIgnoreStatusCodes.includes(err.statusCode))) {
            throw new external_host_error_1.ExternalHostError(err);
        }
        throw err;
    }
}
function applyDefaultHeaders(options) {
    // eslint-disable-next-line no-param-reassign
    options.headers = {
        // TODO: remove. Will be "gzip, deflate, br" by new got default
        'accept-encoding': 'gzip, deflate',
        ...options.headers,
        'user-agent': process.env.RENOVATE_USER_AGENT ||
            'https://github.com/renovatebot/renovate',
    };
}
class Http {
    constructor(hostType, options) {
        this.hostType = hostType;
        this.options = options;
    }
    async request(requestUrl, httpOptions) {
        let url = requestUrl.toString();
        if (httpOptions === null || httpOptions === void 0 ? void 0 : httpOptions.baseUrl) {
            url = url_1.default.resolve(httpOptions.baseUrl, url);
        }
        // TODO: deep merge in order to merge headers
        let options = {
            method: 'get',
            ...this.options,
            hostType: this.hostType,
            ...httpOptions,
        }; // TODO: fixme
        if (process.env.NODE_ENV === 'test') {
            options.retry = 0;
        }
        options.hooks = {
            beforeRedirect: [auth_1.removeAuthorization],
        };
        applyDefaultHeaders(options);
        options = host_rules_1.applyHostRules(url, options);
        if (options.enabled === false) {
            throw new Error(error_messages_1.HOST_DISABLED);
        }
        options = auth_1.applyAuthorization(options);
        // Cache GET requests unless useCache=false
        const cacheKey = crypto_1.default
            .createHash('md5')
            .update('got-' + JSON.stringify({ url, headers: options.headers }))
            .digest('hex');
        if (options.method === 'get' && options.useCache !== false) {
            // return from cache if present
            const cachedRes = memCache.get(cacheKey);
            // istanbul ignore if
            if (cachedRes) {
                return resolveResponse(cachedRes, options);
            }
        }
        const startTime = Date.now();
        const promisedRes = got_1.default(url, options);
        if (options.method === 'get') {
            memCache.set(cacheKey, promisedRes); // always set if it's a get
        }
        const res = await resolveResponse(promisedRes, options);
        const httpRequests = memCache.get('http-requests') || [];
        httpRequests.push({
            method: options.method,
            url,
            duration: Date.now() - startTime,
        });
        memCache.set('http-requests', httpRequests);
        return res;
    }
    get(url, options = {}) {
        return this.request(url, options);
    }
    head(url, options = {}) {
        return this.request(url, { ...options, method: 'head' });
    }
    async requestJson(url, options) {
        const { body, ...jsonOptions } = options;
        if (body) {
            jsonOptions.json = body;
        }
        const res = await this.request(url, {
            ...jsonOptions,
            responseType: 'json',
        });
        return { ...res, body: res.body };
    }
    getJson(url, options) {
        return this.requestJson(url, { ...options });
    }
    headJson(url, options) {
        return this.requestJson(url, { ...options, method: 'head' });
    }
    postJson(url, options) {
        return this.requestJson(url, { ...options, method: 'post' });
    }
    putJson(url, options) {
        return this.requestJson(url, { ...options, method: 'put' });
    }
    patchJson(url, options) {
        return this.requestJson(url, { ...options, method: 'patch' });
    }
    deleteJson(url, options) {
        return this.requestJson(url, { ...options, method: 'delete' });
    }
    stream(url, options) {
        const combinedOptions = {
            method: 'get',
            ...this.options,
            hostType: this.hostType,
            ...options,
        };
        // istanbul ignore else: needs test
        if (options === null || options === void 0 ? void 0 : options.baseUrl) {
            // eslint-disable-next-line no-param-reassign
            url = url_1.default.resolve(options.baseUrl, url);
        }
        applyDefaultHeaders(combinedOptions);
        return got_1.default.stream(url, combinedOptions);
    }
}
exports.Http = Http;
//# sourceMappingURL=index.js.map