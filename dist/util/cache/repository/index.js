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
exports.finalize = exports.getCache = exports.initialize = exports.getCacheFileName = void 0;
const fs = __importStar(require("fs-extra"));
const upath_1 = require("upath");
const logger_1 = require("../../../logger");
let repositoryCache = 'disabled';
let cacheFileName;
let cache = Object.create({});
function getCacheFileName(config) {
    return upath_1.join(config.cacheDir, '/renovate/repository/', config.platform, config.repository + '.json');
}
exports.getCacheFileName = getCacheFileName;
function validate(config, input) {
    if ((input === null || input === void 0 ? void 0 : input.repository) === config.repository) {
        logger_1.logger.debug('Repository cache is valid');
        return input;
    }
    logger_1.logger.info('Repository cache invalidated');
    // reset
    return null;
}
async function initialize(config) {
    cache = null;
    try {
        cacheFileName = getCacheFileName(config);
        repositoryCache = config.repositoryCache;
        if (repositoryCache === 'enabled') {
            cache = validate(config, JSON.parse(await fs.readFile(cacheFileName, 'utf8')));
        }
    }
    catch (err) {
        logger_1.logger.debug({ cacheFileName }, 'Repository cache not found');
    }
    cache = cache || Object.create({});
    cache.repository = config.repository;
}
exports.initialize = initialize;
function getCache() {
    cache = cache || Object.create({});
    return cache;
}
exports.getCache = getCache;
async function finalize() {
    if (cacheFileName && cache && repositoryCache !== 'disabled') {
        await fs.outputFile(cacheFileName, JSON.stringify(cache));
    }
    cacheFileName = null;
    cache = Object.create({});
}
exports.finalize = finalize;
//# sourceMappingURL=index.js.map