"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementLimit = exports.getLimitRemaining = exports.init = exports.setLimit = void 0;
const logger_1 = require("../../logger");
const limitsToInit = ['prCommitsPerRunLimit'];
const l = {};
const v = {};
function setLimit(name, value) {
    logger_1.logger.debug(`Limits.setLimit l[${name}] = ${value}`);
    l[name] = value;
}
exports.setLimit = setLimit;
function init(config) {
    logger_1.logger.debug(`Limits.init enter method`);
    for (const limit of limitsToInit) {
        logger_1.logger.debug(`Limits.init ${limit} processing`);
        if (config[limit]) {
            setLimit(limit, config[limit]);
            v[limit] = 0;
        }
        else {
            logger_1.logger.debug(`Limits.init ${limit} variable is not set. Ignoring ${limit}`);
        }
    }
}
exports.init = init;
function getLimitRemaining(name) {
    let result;
    if (typeof v[name] !== 'undefined') {
        result = l[name] - v[name];
    }
    else {
        result = undefined;
    }
    return result;
}
exports.getLimitRemaining = getLimitRemaining;
function incrementLimit(name, value = 1) {
    if (typeof v[name] !== 'undefined') {
        v[name] += value;
    }
}
exports.incrementLimit = incrementLimit;
//# sourceMappingURL=limits.js.map