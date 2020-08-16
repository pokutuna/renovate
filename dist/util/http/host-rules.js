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
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyHostRules = void 0;
const logger_1 = require("../../logger");
const proxy_1 = require("../../proxy");
const hostRules = __importStar(require("../host-rules"));
// Apply host rules to requests
function applyHostRules(url, inOptions) {
    var _a;
    const options = { ...inOptions };
    const foundRules = hostRules.find({
        hostType: options.hostType,
        url,
    }) || /* istanbul ignore next: can only happen in tests */ {};
    const { username, password, token, enabled } = foundRules;
    if (((_a = options.headers) === null || _a === void 0 ? void 0 : _a.authorization) || options.password || options.token) {
        logger_1.logger.trace(`Authorization already set for host:  ${options.hostname}`);
    }
    else if (password) {
        logger_1.logger.trace(`Applying Basic authentication for host ${options.hostname}`);
        options.username = username;
        options.password = password;
    }
    else if (token) {
        logger_1.logger.trace(`Applying Bearer authentication for host ${options.hostname}`);
        options.token = token;
    }
    else if (enabled === false) {
        options.enabled = false;
    }
    // Apply optional params
    ['abortOnError', 'abortIgnoreStatusCodes', 'timeout'].forEach((param) => {
        if (foundRules[param]) {
            options[param] = foundRules[param];
        }
    });
    if (!proxy_1.hasProxy() && foundRules.enableHttp2 === true) {
        options.http2 = true;
    }
    return options;
}
exports.applyHostRules = applyHostRules;
//# sourceMappingURL=host-rules.js.map