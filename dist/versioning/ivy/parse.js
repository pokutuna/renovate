"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDynamicRevision = exports.REV_TYPE_RANGE = exports.REV_TYPE_SUBREV = exports.REV_TYPE_LATEST = void 0;
const compare_1 = require("../maven/compare");
const REV_TYPE_LATEST = 'REV_TYPE_LATEST';
exports.REV_TYPE_LATEST = REV_TYPE_LATEST;
const REV_TYPE_SUBREV = 'REV_TYPE_SUBREVISION';
exports.REV_TYPE_SUBREV = REV_TYPE_SUBREV;
const REV_TYPE_RANGE = 'REV_TYPE_RANGE';
exports.REV_TYPE_RANGE = REV_TYPE_RANGE;
function parseDynamicRevision(str) {
    if (!str) {
        return null;
    }
    const LATEST_REGEX = /^latest\.|^latest$/i;
    if (LATEST_REGEX.test(str)) {
        const value = str.replace(LATEST_REGEX, '').toLowerCase() || null;
        return {
            type: REV_TYPE_LATEST,
            value: value !== 'integration' ? value : null,
        };
    }
    const SUBREV_REGEX = /\.\+$/;
    if (str.endsWith('.+')) {
        const value = str.replace(SUBREV_REGEX, '');
        if (compare_1.isSingleVersion(value)) {
            return {
                type: REV_TYPE_SUBREV,
                value,
            };
        }
    }
    const range = compare_1.parseRange(str);
    if (range && range.length === 1) {
        return {
            type: REV_TYPE_RANGE,
            value: compare_1.rangeToStr(range),
        };
    }
    return null;
}
exports.parseDynamicRevision = parseDynamicRevision;
//# sourceMappingURL=parse.js.map