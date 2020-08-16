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
exports.init = exports.set = exports.get = void 0;
const path_1 = __importDefault(require("path"));
const cacache = __importStar(require("cacache"));
const luxon_1 = require("luxon");
const logger_1 = require("../../../logger");
function getKey(namespace, key) {
    return `${namespace}-${key}`;
}
let cacheFileName;
async function rm(namespace, key) {
    logger_1.logger.trace({ namespace, key }, 'Removing cache entry');
    await cacache.rm.entry(cacheFileName, getKey(namespace, key));
}
async function get(namespace, key) {
    if (!cacheFileName) {
        return undefined;
    }
    try {
        const res = await cacache.get(cacheFileName, getKey(namespace, key));
        const cachedValue = JSON.parse(res.data.toString());
        if (cachedValue) {
            if (luxon_1.DateTime.local() < luxon_1.DateTime.fromISO(cachedValue.expiry)) {
                logger_1.logger.trace({ namespace, key }, 'Returning cached value');
                return cachedValue.value;
            }
            await rm(namespace, key);
        }
    }
    catch (err) {
        logger_1.logger.trace({ namespace, key }, 'Cache miss');
    }
    return undefined;
}
exports.get = get;
async function set(namespace, key, value, ttlMinutes = 5) {
    if (!cacheFileName) {
        return;
    }
    logger_1.logger.trace({ namespace, key, ttlMinutes }, 'Saving cached value');
    await cacache.put(cacheFileName, getKey(namespace, key), JSON.stringify({
        value,
        expiry: luxon_1.DateTime.local().plus({ minutes: ttlMinutes }),
    }));
}
exports.set = set;
function init(cacheDir) {
    cacheFileName = path_1.default.join(cacheDir, '/renovate/renovate-cache-v1');
    logger_1.logger.debug('Initializing Renovate internal cache into ' + cacheFileName);
}
exports.init = init;
//# sourceMappingURL=file.js.map