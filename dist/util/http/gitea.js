"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiteaHttp = exports.setBaseUrl = void 0;
const url_1 = __importDefault(require("url"));
const platforms_1 = require("../../constants/platforms");
const _1 = require(".");
let baseUrl;
exports.setBaseUrl = (newBaseUrl) => {
    baseUrl = newBaseUrl.replace(/\/*$/, '/');
};
function getPaginationContainer(body) {
    if (Array.isArray(body) && body.length) {
        return body;
    }
    if (Array.isArray(body === null || body === void 0 ? void 0 : body.data) && body.data.length) {
        return body.data;
    }
    return null;
}
function resolveUrl(path) {
    const resolvedUrlString = url_1.default.resolve(baseUrl, path);
    return new url_1.default.URL(resolvedUrlString);
}
class GiteaHttp extends _1.Http {
    constructor(options) {
        super(platforms_1.PLATFORM_TYPE_GITEA, options);
    }
    async request(path, options) {
        const resolvedUrl = resolveUrl(path);
        const opts = {
            baseUrl,
            ...options,
        };
        const res = await super.request(resolvedUrl, opts);
        const pc = getPaginationContainer(res.body);
        if (opts.paginate && pc) {
            const total = parseInt(res.headers['x-total-count'], 10);
            let nextPage = parseInt(resolvedUrl.searchParams.get('page') || '1', 10);
            while (total && pc.length < total) {
                nextPage += 1;
                resolvedUrl.searchParams.set('page', nextPage.toString());
                const nextRes = await super.request(resolvedUrl.toString(), opts);
                const nextPc = getPaginationContainer(nextRes.body);
                if (nextPc === null) {
                    break;
                }
                pc.push(...nextPc);
            }
        }
        return res;
    }
}
exports.GiteaHttp = GiteaHttp;
//# sourceMappingURL=gitea.js.map