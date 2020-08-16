"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthenticationHeaderValue = exports.getDomain = exports.findAllAuthenticatable = void 0;
const url_1 = __importDefault(require("url"));
const host_rules_1 = require("../../util/host-rules");
function isAuthenticatable(rule) {
    return ((!!rule.hostName || !!rule.domainName || !!rule.baseUrl) &&
        ((!!rule.username && !!rule.password) || !!rule.token));
}
function findAllAuthenticatable({ hostType, }) {
    return host_rules_1.findAll({ hostType }).filter(isAuthenticatable);
}
exports.findAllAuthenticatable = findAllAuthenticatable;
function getDomain(hostRule) {
    if (hostRule.hostName) {
        return hostRule.hostName;
    }
    if (hostRule.domainName) {
        return hostRule.domainName;
    }
    if (hostRule.baseUrl) {
        return url_1.default.parse(hostRule.baseUrl).host;
    }
    return null;
}
exports.getDomain = getDomain;
function getAuthenticationHeaderValue(hostRule) {
    if (hostRule.username) {
        return `${hostRule.username}:${hostRule.password}`;
    }
    return hostRule.token;
}
exports.getAuthenticationHeaderValue = getAuthenticationHeaderValue;
//# sourceMappingURL=host-rules.js.map