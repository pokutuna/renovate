"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitbucketHttp = exports.setBaseUrl = void 0;
const platforms_1 = require("../../constants/platforms");
const _1 = require(".");
let baseUrl = 'https://api.bitbucket.org/';
exports.setBaseUrl = (url) => {
    baseUrl = url;
};
class BitbucketHttp extends _1.Http {
    constructor(options) {
        super(platforms_1.PLATFORM_TYPE_BITBUCKET, options);
    }
    request(url, options) {
        const opts = {
            baseUrl,
            ...options,
        };
        return super.request(url, opts);
    }
}
exports.BitbucketHttp = BitbucketHttp;
//# sourceMappingURL=bitbucket.js.map