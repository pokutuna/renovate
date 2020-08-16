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
exports.initPlatform = exports.parseGitAuthor = exports.setPlatformApi = exports.platform = exports.getPlatforms = exports.getPlatformList = void 0;
const url_1 = __importDefault(require("url"));
const email_addresses_1 = __importDefault(require("email-addresses"));
const error_messages_1 = require("../constants/error-messages");
const logger_1 = require("../logger");
const git_1 = require("../util/git");
const hostRules = __importStar(require("../util/host-rules"));
const api_generated_1 = __importDefault(require("./api.generated"));
__exportStar(require("./common"), exports);
exports.getPlatformList = () => Array.from(api_generated_1.default.keys());
exports.getPlatforms = () => api_generated_1.default;
// eslint-disable-next-line @typescript-eslint/naming-convention
let _platform;
const handler = {
    get(_target, prop) {
        if (!_platform) {
            throw new Error(error_messages_1.PLATFORM_NOT_FOUND);
        }
        return _platform[prop];
    },
};
exports.platform = new Proxy({}, handler);
function setPlatformApi(name) {
    if (!api_generated_1.default.has(name)) {
        throw new Error(`Init: Platform "${name}" not found. Must be one of: ${exports.getPlatformList().join(', ')}`);
    }
    _platform = api_generated_1.default.get(name);
}
exports.setPlatformApi = setPlatformApi;
function parseGitAuthor(input) {
    let result = null;
    if (!input) {
        return null;
    }
    try {
        result = email_addresses_1.default.parseOneAddress(input);
        if (result) {
            return result;
        }
        if (input.includes('[bot]@')) {
            // invalid github app/bot addresses
            const parsed = email_addresses_1.default.parseOneAddress(input.replace('[bot]@', '@'));
            if (parsed === null || parsed === void 0 ? void 0 : parsed.address) {
                result = {
                    name: parsed.name || input.replace(/@.*/, ''),
                    address: parsed.address.replace('@', '[bot]@'),
                };
                return result;
            }
        }
        if (input.includes('<') && input.includes('>')) {
            // try wrapping the name part in quotations
            result = email_addresses_1.default.parseOneAddress('"' + input.replace(/(\s?<)/, '"$1'));
            if (result) {
                return result;
            }
        }
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.error({ err }, 'Unknown error parsing gitAuthor');
    }
    // give up
    return null;
}
exports.parseGitAuthor = parseGitAuthor;
async function initPlatform(config) {
    git_1.setPrivateKey(config.gitPrivateKey);
    setPlatformApi(config.platform);
    // TODO: types
    const platformInfo = await exports.platform.initPlatform(config);
    const returnConfig = { ...config, ...platformInfo };
    let gitAuthor;
    if (config === null || config === void 0 ? void 0 : config.gitAuthor) {
        logger_1.logger.debug(`Using configured gitAuthor (${config.gitAuthor})`);
        gitAuthor = config.gitAuthor;
    }
    else if (!(platformInfo === null || platformInfo === void 0 ? void 0 : platformInfo.gitAuthor)) {
        logger_1.logger.debug('Using default gitAuthor: Renovate Bot <renovate@whitesourcesoftware.com>');
        gitAuthor = 'Renovate Bot <renovate@whitesourcesoftware.com>';
    } /* istanbul ignore next */
    else {
        logger_1.logger.debug('Using platform gitAuthor: ' + platformInfo.gitAuthor);
        gitAuthor = platformInfo.gitAuthor;
    }
    const gitAuthorParsed = parseGitAuthor(gitAuthor);
    // istanbul ignore if
    if (!gitAuthorParsed) {
        throw new Error('Init: gitAuthor is not parsed as valid RFC5322 format');
    }
    global.gitAuthor = {
        name: gitAuthorParsed.name,
        email: gitAuthorParsed.address,
    };
    // TODO: types
    const platformRule = {
        hostType: returnConfig.platform,
        hostName: url_1.default.parse(returnConfig.endpoint).hostname,
    };
    ['token', 'username', 'password'].forEach((field) => {
        if (config[field]) {
            platformRule[field] = config[field];
            delete returnConfig[field];
        }
    });
    returnConfig.hostRules = returnConfig.hostRules || [];
    returnConfig.hostRules.push(platformRule);
    hostRules.add(platformRule);
    return returnConfig;
}
exports.initPlatform = initPlatform;
//# sourceMappingURL=index.js.map