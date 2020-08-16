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
exports.api = exports.isVersion = exports.isValid = exports.supportedRangeStrategies = exports.supportsRanges = exports.urls = exports.displayName = exports.id = void 0;
const semver = __importStar(require("semver"));
const semver_stable_1 = require("semver-stable");
const range_1 = require("./range");
exports.id = 'npm';
exports.displayName = 'npm';
exports.urls = [
    'https://semver.org/',
    'https://www.npmjs.com/package/semver',
    'https://docs.npmjs.com/about-semantic-versioning',
    'https://semver.npmjs.com/',
];
exports.supportsRanges = true;
exports.supportedRangeStrategies = ['bump', 'extend', 'pin', 'replace'];
const { compare: sortVersions, maxSatisfying: maxSatisfyingVersion, minSatisfying: minSatisfyingVersion, major: getMajor, minor: getMinor, patch: getPatch, satisfies: matches, valid, validRange, ltr: isLessThanRange, gt: isGreaterThan, eq: equals, } = semver;
// If this is left as an alias, inputs like "17.04.0" throw errors
exports.isValid = (input) => validRange(input);
exports.isVersion = (input) => valid(input);
const isSingleVersion = (constraint) => exports.isVersion(constraint) ||
    (constraint.startsWith('=') && exports.isVersion(constraint.substring(1).trim()));
exports.api = {
    equals,
    getMajor,
    getMinor,
    getNewValue: range_1.getNewValue,
    getPatch,
    isCompatible: exports.isVersion,
    isGreaterThan,
    isLessThanRange,
    isSingleVersion,
    isStable: semver_stable_1.is,
    isValid: exports.isValid,
    isVersion: exports.isVersion,
    matches,
    maxSatisfyingVersion,
    minSatisfyingVersion,
    sortVersions,
};
exports.default = exports.api;
//# sourceMappingURL=index.js.map