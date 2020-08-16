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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clear = exports.findAll = exports.hosts = exports.find = exports.add = void 0;
const url_1 = __importDefault(require("url"));
const deepmerge_1 = __importDefault(require("deepmerge"));
const logger_1 = require("../logger");
const sanitize = __importStar(require("./sanitize"));
let hostRules = [];
function add(params) {
    if (params.domainName && params.hostName) {
        throw new Error('hostRules cannot contain both a domainName and hostName');
    }
    if (params.domainName && params.baseUrl) {
        throw new Error('hostRules cannot contain both a domainName and baseUrl');
    }
    if (params.hostName && params.baseUrl) {
        throw new Error('hostRules cannot contain both a hostName and baseUrl');
    }
    hostRules.push(params);
    const confidentialFields = ['password', 'token'];
    confidentialFields.forEach((field) => {
        const secret = params[field];
        if (secret && secret.length > 3) {
            sanitize.add(secret);
        }
    });
    if (params.username && params.password) {
        const secret = Buffer.from(`${params.username}:${params.password}`).toString('base64');
        sanitize.add(secret);
    }
}
exports.add = add;
function isEmptyRule(rule) {
    return !rule.hostType && !rule.domainName && !rule.hostName && !rule.baseUrl;
}
function isHostTypeRule(rule) {
    return rule.hostType && !rule.domainName && !rule.hostName && !rule.baseUrl;
}
function isDomainNameRule(rule) {
    return !rule.hostType && !!rule.domainName;
}
function isHostNameRule(rule) {
    return !rule.hostType && !!rule.hostName;
}
function isBaseUrlRule(rule) {
    return !rule.hostType && !!rule.baseUrl;
}
function isMultiRule(rule) {
    return rule.hostType && !!(rule.domainName || rule.hostName || rule.baseUrl);
}
function matchesHostType(rule, search) {
    return rule.hostType === search.hostType;
}
function matchesDomainName(rule, search) {
    const hostname = search.url && url_1.default.parse(search.url).hostname;
    return (search.url &&
        rule.domainName &&
        hostname &&
        hostname.endsWith(rule.domainName));
}
function matchesHostName(rule, search) {
    return (search.url &&
        rule.hostName &&
        url_1.default.parse(search.url).hostname === rule.hostName);
}
function matchesBaseUrl(rule, search) {
    return search.url && rule.baseUrl && search.url.startsWith(rule.baseUrl);
}
function find(search) {
    if (!(search.hostType || search.url)) {
        logger_1.logger.warn({ search }, 'Invalid hostRules search');
        return {};
    }
    let res = {};
    // First, apply empty rule matches
    hostRules
        .filter((rule) => isEmptyRule(rule))
        .forEach((rule) => {
        res = deepmerge_1.default(res, rule);
    });
    // Next, find hostType-only matches
    hostRules
        .filter((rule) => isHostTypeRule(rule) && matchesHostType(rule, search))
        .forEach((rule) => {
        res = deepmerge_1.default(res, rule);
    });
    // Next, find domainName-only matches
    hostRules
        .filter((rule) => isDomainNameRule(rule) && matchesDomainName(rule, search))
        .forEach((rule) => {
        res = deepmerge_1.default(res, rule);
    });
    // Next, find hostName-only matches
    hostRules
        .filter((rule) => isHostNameRule(rule) && matchesHostName(rule, search))
        .forEach((rule) => {
        res = deepmerge_1.default(res, rule);
    });
    // Next, find baseUrl-only matches
    hostRules
        .filter((rule) => isBaseUrlRule(rule) && matchesBaseUrl(rule, search))
        .forEach((rule) => {
        res = deepmerge_1.default(res, rule);
    });
    // Finally, find combination matches
    hostRules
        .filter((rule) => isMultiRule(rule) &&
        matchesHostType(rule, search) &&
        (matchesDomainName(rule, search) ||
            matchesHostName(rule, search) ||
            matchesBaseUrl(rule, search)))
        .forEach((rule) => {
        res = deepmerge_1.default(res, rule);
    });
    delete res.hostType;
    delete res.domainName;
    delete res.hostName;
    delete res.baseUrl;
    return res;
}
exports.find = find;
function hosts({ hostType }) {
    return hostRules
        .filter((rule) => rule.hostType === hostType)
        .map((rule) => {
        if (rule.hostName) {
            return rule.hostName;
        }
        if (rule.baseUrl) {
            return url_1.default.parse(rule.baseUrl).hostname;
        }
        return null;
    })
        .filter(Boolean);
}
exports.hosts = hosts;
function findAll({ hostType }) {
    return hostRules.filter((rule) => rule.hostType === hostType);
}
exports.findAll = findAll;
function clear() {
    hostRules = [];
    sanitize.clear();
}
exports.clear = clear;
//# sourceMappingURL=host-rules.js.map