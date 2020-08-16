"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitbucketServerHttp = exports.setBaseUrl = void 0;
const url_1 = __importDefault(require("url"));
const platforms_1 = require("../../constants/platforms");
const _1 = require(".");
let baseUrl;
exports.setBaseUrl = (url) => {
    baseUrl = url;
};
class BitbucketServerHttp extends _1.Http {
    constructor(options) {
        super(platforms_1.PLATFORM_TYPE_BITBUCKET_SERVER, options);
    }
    request(path, options) {
        const url = url_1.default.resolve(baseUrl, path);
        const opts = {
            baseUrl,
            ...options,
        };
        opts.headers = {
            ...opts.headers,
            'X-Atlassian-Token': 'no-check',
        };
        return super.request(url, opts);
    }
}
exports.BitbucketServerHttp = BitbucketServerHttp;
//# sourceMappingURL=bitbucket-server.js.map