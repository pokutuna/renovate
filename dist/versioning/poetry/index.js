"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.isValid = exports.supportedRangeStrategies = exports.supportsRanges = exports.urls = exports.displayName = exports.id = void 0;
const semver_1 = require("semver");
const semver_utils_1 = require("semver-utils");
const npm_1 = require("../npm");
exports.id = 'poetry';
exports.displayName = 'Poetry';
exports.urls = ['https://python-poetry.org/docs/versions/'];
exports.supportsRanges = true;
exports.supportedRangeStrategies = ['bump', 'extend', 'pin', 'replace'];
function notEmpty(s) {
    return s !== '';
}
// This function works like cargo2npm, but it doesn't
// add a '^', because poetry treats versions without operators as
// exact versions.
function poetry2npm(input) {
    const versions = input
        .split(',')
        .map((str) => str.trim())
        .filter(notEmpty);
    return versions.join(' ');
}
// NOTE: This function is copied from cargo versionsing code.
// Poetry uses commas (like in cargo) instead of spaces (like in npm)
// for AND operation.
function npm2poetry(input) {
    // Note: this doesn't remove the ^
    const res = input
        .split(' ')
        .map((str) => str.trim())
        .filter(notEmpty);
    const operators = ['^', '~', '=', '>', '<', '<=', '>='];
    for (let i = 0; i < res.length - 1; i += 1) {
        if (operators.includes(res[i])) {
            const newValue = res[i] + ' ' + res[i + 1];
            res.splice(i, 2, newValue);
        }
    }
    return res.join(', ').replace(/\s*,?\s*\|\|\s*,?\s*/, ' || ');
}
const isLessThanRange = (version, range) => npm_1.api.isLessThanRange(version, poetry2npm(range));
exports.isValid = (input) => npm_1.api.isValid(poetry2npm(input));
const isVersion = (input) => npm_1.api.isVersion(input);
const matches = (version, range) => npm_1.api.matches(version, poetry2npm(range));
const maxSatisfyingVersion = (versions, range) => npm_1.api.maxSatisfyingVersion(versions, poetry2npm(range));
const minSatisfyingVersion = (versions, range) => npm_1.api.minSatisfyingVersion(versions, poetry2npm(range));
const isSingleVersion = (constraint) => (constraint.trim().startsWith('=') &&
    isVersion(constraint.trim().substring(1).trim())) ||
    isVersion(constraint.trim());
function handleShort(operator, currentValue, toVersion) {
    const toVersionMajor = semver_1.major(toVersion);
    const toVersionMinor = semver_1.minor(toVersion);
    const split = currentValue.split('.');
    if (split.length === 1) {
        // [^,~]4
        return operator + toVersionMajor;
    }
    if (split.length === 2) {
        // [^,~]4.1
        return operator + toVersionMajor + '.' + toVersionMinor;
    }
    return null;
}
function getNewValue({ currentValue, rangeStrategy, fromVersion, toVersion, }) {
    if (rangeStrategy === 'replace') {
        const npmCurrentValue = poetry2npm(currentValue);
        const parsedRange = semver_utils_1.parseRange(npmCurrentValue);
        const element = parsedRange[parsedRange.length - 1];
        if (parsedRange.length === 1 && element.operator) {
            if (element.operator === '^') {
                const version = handleShort('^', npmCurrentValue, toVersion);
                if (version) {
                    return npm2poetry(version);
                }
            }
            if (element.operator === '~') {
                const version = handleShort('~', npmCurrentValue, toVersion);
                if (version) {
                    return npm2poetry(version);
                }
            }
        }
    }
    const newSemver = npm_1.api.getNewValue({
        currentValue: poetry2npm(currentValue),
        rangeStrategy,
        fromVersion,
        toVersion,
    });
    const newPoetry = npm2poetry(newSemver);
    return newPoetry;
}
exports.api = {
    ...npm_1.api,
    getNewValue,
    isLessThanRange,
    isSingleVersion,
    isValid: exports.isValid,
    matches,
    maxSatisfyingVersion,
    minSatisfyingVersion,
};
exports.default = exports.api;
//# sourceMappingURL=index.js.map