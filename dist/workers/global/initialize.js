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
exports.globalFinalize = exports.globalInitialize = void 0;
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const logger_1 = require("../../logger");
const platform_1 = require("../../platform");
const packageCache = __importStar(require("../../util/cache/package"));
const emoji_1 = require("../../util/emoji");
const limits = __importStar(require("./limits"));
async function setDirectories(input) {
    const config = { ...input };
    process.env.TMPDIR = process.env.RENOVATE_TMPDIR || os_1.default.tmpdir();
    if (config.baseDir) {
        logger_1.logger.debug('Using configured baseDir: ' + config.baseDir);
    }
    else {
        config.baseDir = path_1.default.join(process.env.TMPDIR, 'renovate');
        logger_1.logger.debug('Using baseDir: ' + config.baseDir);
    }
    await fs_extra_1.default.ensureDir(config.baseDir);
    if (config.cacheDir) {
        logger_1.logger.debug('Using configured cacheDir: ' + config.cacheDir);
    }
    else {
        config.cacheDir = path_1.default.join(config.baseDir, 'cache');
        logger_1.logger.debug('Using cacheDir: ' + config.cacheDir);
    }
    await fs_extra_1.default.ensureDir(config.cacheDir);
    return config;
}
async function globalInitialize(config_) {
    let config = config_;
    config = await platform_1.initPlatform(config);
    config = await setDirectories(config);
    packageCache.init(config);
    limits.init(config);
    emoji_1.setEmojiConfig(config);
    return config;
}
exports.globalInitialize = globalInitialize;
function globalFinalize(config) {
    packageCache.cleanup(config);
}
exports.globalFinalize = globalFinalize;
//# sourceMappingURL=initialize.js.map