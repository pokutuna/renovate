"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeAuthorization = exports.applyAuthorization = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const platforms_1 = require("../../constants/platforms");
function applyAuthorization(inOptions) {
    var _a;
    const options = { ...inOptions };
    if ((_a = options.headers) === null || _a === void 0 ? void 0 : _a.authorization) {
        return options;
    }
    if (options.token) {
        if (options.hostType === platforms_1.PLATFORM_TYPE_GITEA) {
            options.headers.authorization = `token ${options.token}`;
        }
        else if (options.hostType === platforms_1.PLATFORM_TYPE_GITHUB) {
            options.headers.authorization = `token ${options.token}`;
            if (options.token.startsWith('x-access-token:')) {
                const appToken = options.token.replace('x-access-token:', '');
                options.headers.authorization = `token ${appToken}`;
                if (is_1.default.string(options.headers.accept)) {
                    options.headers.accept = options.headers.accept.replace('application/vnd.github.v3+json', 'application/vnd.github.machine-man-preview+json');
                }
            }
        }
        else if (options.hostType === platforms_1.PLATFORM_TYPE_GITLAB) {
            options.headers['Private-token'] = options.token;
        }
        else {
            options.headers.authorization = `Bearer ${options.token}`;
        }
        delete options.token;
    }
    else if (options.password) {
        // Otherwise got will add username and password to url and header
        const auth = Buffer.from(`${options.username || ''}:${options.password}`).toString('base64');
        options.headers.authorization = `Basic ${auth}`;
        delete options.username;
        delete options.password;
    }
    return options;
}
exports.applyAuthorization = applyAuthorization;
// isAmazon return true if request options contains Amazon related headers
function isAmazon(options) {
    var _a;
    return (_a = options.search) === null || _a === void 0 ? void 0 : _a.includes('X-Amz-Algorithm');
}
// isAzureBlob return true if request options contains Azure container registry related data
function isAzureBlob(options) {
    var _a, _b;
    return (((_a = options.hostname) === null || _a === void 0 ? void 0 : _a.endsWith('.blob.core.windows.net')) && // lgtm [js/incomplete-url-substring-sanitization]
     ((_b = options.href) === null || _b === void 0 ? void 0 : _b.includes('/docker/registry')));
}
// removeAuthorization from the redirect options
function removeAuthorization(options) {
    var _a;
    if (!options.password && !((_a = options.headers) === null || _a === void 0 ? void 0 : _a.authorization)) {
        return;
    }
    // Check if request has been redirected to Amazon or an Azure blob (ACR)
    if (isAmazon(options) || isAzureBlob(options)) {
        // if there is no port in the redirect URL string, then delete it from the redirect options.
        // This can be evaluated for removal after upgrading to Got v10
        const portInUrl = options.href.split('/')[2].split(':')[1];
        // istanbul ignore next
        if (!portInUrl) {
            // eslint-disable-next-line no-param-reassign
            delete options.port; // Redirect will instead use 80 or 443 for HTTP or HTTPS respectively
        }
        // registry is hosted on Amazon or Azure blob, redirect url includes
        // authentication which is not required and should be removed
        delete options.headers.authorization; // eslint-disable-line no-param-reassign
        delete options.username; // eslint-disable-line no-param-reassign
        delete options.password; // eslint-disable-line no-param-reassign
    }
}
exports.removeAuthorization = removeAuthorization;
//# sourceMappingURL=auth.js.map