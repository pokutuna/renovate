"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeRegExp = exports.regEx = void 0;
const error_messages_1 = require("../constants/error-messages");
const logger_1 = require("../logger");
let RegEx;
try {
    // eslint-disable-next-line
    const RE2 = require('re2');
    // Test if native is working
    new RE2('.*').exec('test');
    logger_1.logger.debug('Using RE2 as regex engine');
    RegEx = RE2;
}
catch (err) {
    logger_1.logger.warn({ err }, 'RE2 not usable, falling back to RegExp');
    RegEx = RegExp;
}
function regEx(pattern, flags) {
    try {
        return new RegEx(pattern, flags);
    }
    catch (err) {
        const error = new Error(error_messages_1.CONFIG_VALIDATION);
        error.configFile = pattern;
        error.validationError = 'Invalid regular expression: ' + err.toString();
        throw error;
    }
}
exports.regEx = regEx;
function escapeRegExp(input) {
    return input.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
exports.escapeRegExp = escapeRegExp;
//# sourceMappingURL=regex.js.map