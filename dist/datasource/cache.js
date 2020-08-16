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
exports.cacheAble = void 0;
const logger_1 = require("../logger");
const packageCache = __importStar(require("../util/cache/package"));
/**
 * Loads result from cache or from passed callback on cache miss.
 * @param param0 Cache config args
 */
async function cacheAble({ id, lookup, cb, minutes = 60, }) {
    const cacheNamespace = `datasource-${id}`;
    const cacheKey = JSON.stringify(lookup);
    const cachedResult = await packageCache.get(cacheNamespace, cacheKey);
    // istanbul ignore if
    if (cachedResult) {
        logger_1.logger.trace({ id, lookup }, 'datasource cachedResult');
        return cachedResult;
    }
    const { data, isPrivate } = await cb(lookup);
    // istanbul ignore if
    if (isPrivate) {
        logger_1.logger.trace({ id, lookup }, 'Skipping datasource cache for private data');
    }
    else {
        await packageCache.set(cacheNamespace, cacheKey, data, minutes);
    }
    return data;
}
exports.cacheAble = cacheAble;
//# sourceMappingURL=cache.js.map