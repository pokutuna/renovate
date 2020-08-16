"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitlabHttp = exports.setBaseUrl = void 0;
const parse_link_header_1 = __importDefault(require("parse-link-header"));
const platforms_1 = require("../../constants/platforms");
const logger_1 = require("../../logger");
const external_host_error_1 = require("../../types/errors/external-host-error");
const _1 = require(".");
let baseUrl = 'https://gitlab.com/api/v4/';
exports.setBaseUrl = (url) => {
    baseUrl = url;
};
class GitlabHttp extends _1.Http {
    constructor(options) {
        super(platforms_1.PLATFORM_TYPE_GITLAB, options);
    }
    async request(url, options) {
        let result = null;
        const opts = {
            baseUrl,
            ...options,
            throwHttpErrors: true,
        };
        try {
            result = await super.request(url, opts);
            if (opts.paginate) {
                // Check if result is paginated
                try {
                    const linkHeader = parse_link_header_1.default(result.headers.link);
                    if (linkHeader === null || linkHeader === void 0 ? void 0 : linkHeader.next) {
                        result.body = result.body.concat((await this.request(linkHeader.next.url, opts)).body);
                    }
                }
                catch (err) /* istanbul ignore next */ {
                    logger_1.logger.warn({ err }, 'Pagination error');
                }
            }
            return result;
        }
        catch (err) {
            if (err.statusCode === 404) {
                logger_1.logger.trace({ err }, 'GitLab 404');
                logger_1.logger.debug({ url: err.url }, 'GitLab API 404');
                throw err;
            }
            logger_1.logger.debug({ err }, 'Gitlab API error');
            if (err.statusCode === 429 ||
                (err.statusCode >= 500 && err.statusCode < 600)) {
                throw new external_host_error_1.ExternalHostError(err, platforms_1.PLATFORM_TYPE_GITLAB);
            }
            const platformFailureCodes = [
                'EAI_AGAIN',
                'ECONNRESET',
                'ETIMEDOUT',
                'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
            ];
            if (platformFailureCodes.includes(err.code)) {
                throw new external_host_error_1.ExternalHostError(err, platforms_1.PLATFORM_TYPE_GITLAB);
            }
            if (err.name === 'ParseError') {
                throw new external_host_error_1.ExternalHostError(err, platforms_1.PLATFORM_TYPE_GITLAB);
            }
            throw err;
        }
    }
}
exports.GitlabHttp = GitlabHttp;
//# sourceMappingURL=gitlab.js.map