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
exports.api = exports.matches = exports.isVersion = exports.isSingleVersion = exports.isValid = exports.supportedRangeStrategies = exports.supportsRanges = exports.urls = exports.displayName = exports.id = void 0;
const pep440 = __importStar(require("@renovate/pep440"));
const specifier_1 = require("@renovate/pep440/lib/specifier");
const range_1 = require("./range");
exports.id = 'pep440';
exports.displayName = 'PEP440';
exports.urls = ['https://www.python.org/dev/peps/pep-0440/'];
exports.supportsRanges = true;
exports.supportedRangeStrategies = ['bump', 'extend', 'pin', 'replace'];
const { compare: sortVersions, satisfies: matches, valid: isVersion, validRange, explain, gt: isGreaterThan, major: getMajor, minor: getMinor, patch: getPatch, eq, } = pep440;
exports.matches = matches;
exports.isVersion = isVersion;
const isStable = (input) => {
    const version = explain(input);
    if (!version) {
        return false;
    }
    return !version.is_prerelease;
};
// If this is left as an alias, inputs like "17.04.0" throw errors
exports.isValid = (input) => validRange(input) || isVersion(input);
const maxSatisfyingVersion = (versions, range) => {
    const found = specifier_1.filter(versions, range).sort(sortVersions);
    return found.length === 0 ? null : found[found.length - 1];
};
const minSatisfyingVersion = (versions, range) => {
    const found = specifier_1.filter(versions, range).sort(sortVersions);
    return found.length === 0 ? null : found[0];
};
exports.isSingleVersion = (constraint) => isVersion(constraint) ||
    (constraint.startsWith('==') && isVersion(constraint.substring(2).trim()));
const equals = (version1, version2) => {
    return isVersion(version1) && isVersion(version2) && eq(version1, version2);
};
exports.api = {
    equals,
    getMajor,
    getMinor,
    getPatch,
    isCompatible: isVersion,
    isGreaterThan,
    isSingleVersion: exports.isSingleVersion,
    isStable,
    isValid: exports.isValid,
    isVersion,
    matches,
    maxSatisfyingVersion,
    minSatisfyingVersion,
    getNewValue: range_1.getNewValue,
    sortVersions,
};
exports.default = exports.api;
//# sourceMappingURL=index.js.map