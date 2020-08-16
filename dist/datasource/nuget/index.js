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
exports.getReleases = exports.registryStrategy = exports.defaultRegistryUrls = void 0;
const url_1 = __importDefault(require("url"));
const logger_1 = require("../../logger");
const v2 = __importStar(require("./v2"));
const v3 = __importStar(require("./v3"));
var common_1 = require("./common");
Object.defineProperty(exports, "id", { enumerable: true, get: function () { return common_1.id; } });
exports.defaultRegistryUrls = [v3.getDefaultFeed()];
exports.registryStrategy = 'merge';
function parseRegistryUrl(registryUrl) {
    try {
        const parsedUrl = url_1.default.parse(registryUrl);
        let protocolVersion = 2;
        const protolVersionRegExp = /#protocolVersion=(2|3)/;
        const protocolVersionMatch = protolVersionRegExp.exec(parsedUrl.hash);
        if (protocolVersionMatch) {
            parsedUrl.hash = '';
            protocolVersion = Number.parseInt(protocolVersionMatch[1], 10);
        }
        else if (parsedUrl.pathname.endsWith('.json')) {
            protocolVersion = 3;
        }
        return { feedUrl: url_1.default.format(parsedUrl), protocolVersion };
    }
    catch (e) {
        logger_1.logger.debug({ e }, `nuget registry failure: can't parse ${registryUrl}`);
        return { feedUrl: registryUrl, protocolVersion: null };
    }
}
async function getReleases({ lookupName, registryUrl, }) {
    logger_1.logger.trace(`nuget.getReleases(${lookupName})`);
    const { feedUrl, protocolVersion } = parseRegistryUrl(registryUrl);
    if (protocolVersion === 2) {
        return v2.getReleases(feedUrl, lookupName);
    }
    if (protocolVersion === 3) {
        const queryUrl = await v3.getQueryUrl(feedUrl);
        if (queryUrl !== null) {
            return v3.getReleases(feedUrl, queryUrl, lookupName);
        }
    }
    return null;
}
exports.getReleases = getReleases;
//# sourceMappingURL=index.js.map