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
exports.cleanup = exports.init = exports.set = exports.get = void 0;
const memCache = __importStar(require("../memory"));
const fileCache = __importStar(require("./file"));
const redisCache = __importStar(require("./redis"));
let cacheProxy;
function getGlobalKey(namespace, key) {
    return `global%%${namespace}%%${key}`;
}
function get(namespace, key) {
    if (!cacheProxy) {
        return undefined;
    }
    const globalKey = getGlobalKey(namespace, key);
    if (!memCache.get(globalKey)) {
        memCache.set(globalKey, cacheProxy.get(namespace, key));
    }
    return memCache.get(globalKey);
}
exports.get = get;
function set(namespace, key, value, minutes) {
    if (!cacheProxy) {
        return undefined;
    }
    const globalKey = getGlobalKey(namespace, key);
    memCache.set(globalKey, value);
    return cacheProxy.set(namespace, key, value, minutes);
}
exports.set = set;
function init(config) {
    if (config.redisUrl) {
        redisCache.init(config.redisUrl);
        cacheProxy = {
            get: redisCache.get,
            set: redisCache.set,
        };
    }
    else {
        fileCache.init(config.cacheDir);
        cacheProxy = {
            get: fileCache.get,
            set: fileCache.set,
        };
    }
}
exports.init = init;
function cleanup(config) {
    if (config.redisUrl) {
        redisCache.end();
    }
}
exports.cleanup = cleanup;
//# sourceMappingURL=index.js.map