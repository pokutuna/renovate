"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.maxSatisfyingVersion = exports.isValid = exports.isVersion = exports.supportsRanges = exports.urls = exports.displayName = exports.id = void 0;
const semver_1 = __importDefault(require("semver"));
const semver_stable_1 = __importDefault(require("semver-stable"));
exports.id = 'semver';
exports.displayName = 'Semantic';
exports.urls = ['https://semver.org/'];
exports.supportsRanges = false;
const { is: isStable } = semver_stable_1.default;
const { compare: sortVersions, maxSatisfying: maxSatisfyingVersion, minSatisfying: minSatisfyingVersion, major: getMajor, minor: getMinor, patch: getPatch, satisfies: matches, valid, ltr: isLessThanRange, gt: isGreaterThan, eq: equals, } = semver_1.default;
exports.maxSatisfyingVersion = maxSatisfyingVersion;
// If this is left as an alias, inputs like "17.04.0" throw errors
exports.isVersion = (input) => valid(input);
exports.isValid = exports.isVersion;
function getNewValue({ toVersion }) {
    return toVersion;
}
exports.api = {
    equals,
    getMajor,
    getMinor,
    getPatch,
    isCompatible: exports.isVersion,
    isGreaterThan,
    isLessThanRange,
    isSingleVersion: exports.isVersion,
    isStable,
    isValid: exports.isVersion,
    isVersion: exports.isVersion,
    matches,
    maxSatisfyingVersion,
    minSatisfyingVersion,
    getNewValue,
    sortVersions,
};
exports.default = exports.api;
//# sourceMappingURL=index.js.map