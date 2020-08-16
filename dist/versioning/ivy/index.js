"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.supportedRangeStrategies = exports.supportsRanges = exports.urls = exports.displayName = exports.id = void 0;
const maven_1 = __importDefault(require("../maven"));
const compare_1 = require("../maven/compare");
const parse_1 = require("./parse");
exports.id = 'ivy';
exports.displayName = 'Ivy';
exports.urls = ['https://ant.apache.org/ivy/'];
exports.supportsRanges = true;
exports.supportedRangeStrategies = ['bump', 'extend', 'pin', 'replace'];
// eslint-disable-next-line @typescript-eslint/unbound-method
const { equals, getMajor, getMinor, getPatch, isGreaterThan, isSingleVersion, isStable, matches: mavenMatches, maxSatisfyingVersion, minSatisfyingVersion, getNewValue, sortVersions, } = maven_1.default;
function isVersion(str) {
    if (!str) {
        return false;
    }
    return isSingleVersion(str) || !!parse_1.parseDynamicRevision(str);
}
function matches(a, b) {
    if (!a) {
        return false;
    }
    if (!b) {
        return false;
    }
    const dynamicRevision = parse_1.parseDynamicRevision(b);
    if (!dynamicRevision) {
        return equals(a, b);
    }
    const { type, value } = dynamicRevision;
    if (type === parse_1.REV_TYPE_LATEST) {
        if (!value) {
            return true;
        }
        const tokens = compare_1.tokenize(a);
        if (tokens.length) {
            const token = tokens[tokens.length - 1];
            if (token.type === compare_1.TYPE_QUALIFIER) {
                return token.val.toLowerCase() === value;
            }
        }
        return false;
    }
    if (type === parse_1.REV_TYPE_SUBREV) {
        return compare_1.isSubversion(value, a);
    }
    return mavenMatches(a, value);
}
exports.api = {
    equals,
    getMajor,
    getMinor,
    getPatch,
    isCompatible: isVersion,
    isGreaterThan,
    isSingleVersion,
    isStable,
    isValid: isVersion,
    isVersion,
    matches,
    maxSatisfyingVersion,
    minSatisfyingVersion,
    getNewValue,
    sortVersions,
};
exports.default = exports.api;
//# sourceMappingURL=index.js.map