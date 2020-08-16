"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.isVersion = exports.isValid = exports.supportedRangeStrategies = exports.supportsRanges = exports.urls = exports.displayName = exports.id = void 0;
const semver_1 = __importDefault(require("semver"));
const semver_stable_1 = __importDefault(require("semver-stable"));
const range_1 = require("./range");
exports.id = 'swift';
exports.displayName = 'Swift';
exports.urls = ['https://swift.org/package-manager/'];
exports.supportsRanges = true;
exports.supportedRangeStrategies = ['bump', 'extend', 'pin', 'replace'];
const { is: isStable } = semver_stable_1.default;
const { compare: sortVersions, maxSatisfying, minSatisfying, major: getMajor, minor: getMinor, patch: getPatch, satisfies, valid, validRange, ltr, gt: isGreaterThan, eq: equals, } = semver_1.default;
exports.isValid = (input) => !!valid(input) || !!validRange(range_1.toSemverRange(input));
exports.isVersion = (input) => !!valid(input);
const maxSatisfyingVersion = (versions, range) => maxSatisfying(versions.map((v) => v.replace(/^v/, '')), range_1.toSemverRange(range));
const minSatisfyingVersion = (versions, range) => minSatisfying(versions.map((v) => v.replace(/^v/, '')), range_1.toSemverRange(range));
const isLessThanRange = (version, range) => ltr(version, range_1.toSemverRange(range));
const matches = (version, range) => satisfies(version, range_1.toSemverRange(range));
exports.api = {
    equals,
    getMajor,
    getMinor,
    getNewValue: range_1.getNewValue,
    getPatch,
    isCompatible: exports.isVersion,
    isGreaterThan,
    isLessThanRange,
    isSingleVersion: exports.isVersion,
    isStable,
    isValid: exports.isValid,
    isVersion: exports.isVersion,
    matches,
    maxSatisfyingVersion,
    minSatisfyingVersion,
    sortVersions,
};
exports.default = exports.api;
//# sourceMappingURL=index.js.map