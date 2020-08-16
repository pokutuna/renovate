"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = exports.set = exports.get = exports.end = void 0;
/* istanbul ignore file */
const handy_redis_1 = require("handy-redis");
const luxon_1 = require("luxon");
const logger_1 = require("../../../logger");
let client;
function getKey(namespace, key) {
    return `${namespace}-${key}`;
}
function end() {
    var _a;
    try {
        (_a = client === null || client === void 0 ? void 0 : client.redis) === null || _a === void 0 ? void 0 : _a.end(true); // TODO: Why is this not supported by client directly?
    }
    catch (err) {
        logger_1.logger.warn({ err }, 'Redis cache end failed');
    }
}
exports.end = end;
async function rm(namespace, key) {
    logger_1.logger.trace({ namespace, key }, 'Removing cache entry');
    await (client === null || client === void 0 ? void 0 : client.del(getKey(namespace, key)));
}
async function get(namespace, key) {
    if (!client) {
        return undefined;
    }
    logger_1.logger.trace(`cache.get(${namespace}, ${key})`);
    try {
        const res = await (client === null || client === void 0 ? void 0 : client.get(getKey(namespace, key)));
        const cachedValue = JSON.parse(res);
        if (cachedValue) {
            if (luxon_1.DateTime.local() < luxon_1.DateTime.fromISO(cachedValue.expiry)) {
                logger_1.logger.trace({ namespace, key }, 'Returning cached value');
                return cachedValue.value;
            }
            // istanbul ignore next
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
    logger_1.logger.trace({ namespace, key, ttlMinutes }, 'Saving cached value');
    await (client === null || client === void 0 ? void 0 : client.set(getKey(namespace, key), JSON.stringify({
        value,
        expiry: luxon_1.DateTime.local().plus({ minutes: ttlMinutes }),
    }), ['EX', ttlMinutes * 60]));
}
exports.set = set;
function init(url) {
    if (!url) {
        return;
    }
    logger_1.logger.debug('Redis cache init');
    client = handy_redis_1.createHandyClient({
        url,
        retry_strategy: (options) => {
            if (options.error) {
                logger_1.logger.error({ err: options.error }, 'Redis cache error');
            }
            // Reconnect after this time
            return Math.min(options.attempt * 100, 3000);
        },
    });
}
exports.init = init;
//# sourceMappingURL=redis.js.map