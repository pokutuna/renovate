"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.isVersion = exports.isValid = exports.supportedRangeStrategies = exports.supportsRanges = exports.urls = exports.displayName = exports.id = void 0;
const semver_1 = require("semver");
const logger_1 = require("../../logger");
const npm_1 = require("../npm");
exports.id = 'composer';
exports.displayName = 'Composer';
exports.urls = [
    'https://getcomposer.org/doc/articles/versions.md',
    'https://packagist.org/packages/composer/semver',
    'https://madewithlove.be/tilde-and-caret-constraints/',
    'https://semver.mwl.be',
];
exports.supportsRanges = true;
exports.supportedRangeStrategies = ['bump', 'extend', 'pin', 'replace'];
function getVersionParts(input) {
    const versionParts = input.split('-');
    if (versionParts.length === 1) {
        return [input, ''];
    }
    return [versionParts[0], '-' + versionParts[1]];
}
function padZeroes(input) {
    const [output, stability] = getVersionParts(input);
    const sections = output.split('.');
    while (sections.length < 3) {
        sections.push('0');
    }
    return sections.join('.') + stability;
}
function convertStabilitiyModifier(input) {
    // Handle stability modifiers.
    const versionParts = input.split('@');
    if (versionParts.length === 1) {
        return input;
    }
    // 1.0@beta2 to 1.0-beta.2
    const stability = versionParts[1].replace(/(?:^|\s)(beta|alpha|rc)([1-9][0-9]*)(?: |$)/gi, '$1.$2');
    // If there is a stability part, npm semver expects the version
    // to be full
    return padZeroes(versionParts[0]) + '-' + stability;
}
function normalizeVersion(input) {
    let output = input;
    output = output.replace(/(^|>|>=|\^|~)v/i, '$1');
    return convertStabilitiyModifier(output);
}
function composer2npm(input) {
    const cleanInput = normalizeVersion(input);
    if (npm_1.api.isVersion(cleanInput)) {
        return cleanInput;
    }
    if (npm_1.api.isVersion(padZeroes(cleanInput))) {
        return padZeroes(cleanInput);
    }
    const [versionId, stability] = getVersionParts(cleanInput);
    let output = versionId;
    // ~4 to ^4 and ~4.1 to ^4.1
    output = output.replace(/(?:^|\s)~([1-9][0-9]*(?:\.[0-9]*)?)(?: |$)/g, '^$1');
    // ~0.4 to >=0.4 <1
    output = output.replace(/(?:^|\s)~(0\.[1-9][0-9]*)(?: |$)/g, '>=$1 <1');
    return output + stability;
}
const equals = (a, b) => npm_1.api.equals(composer2npm(a), composer2npm(b));
const getMajor = (version) => npm_1.api.getMajor(semver_1.coerce(composer2npm(version)));
const getMinor = (version) => npm_1.api.getMinor(semver_1.coerce(composer2npm(version)));
const getPatch = (version) => npm_1.api.getPatch(semver_1.coerce(composer2npm(version)));
const isGreaterThan = (a, b) => npm_1.api.isGreaterThan(composer2npm(a), composer2npm(b));
const isLessThanRange = (version, range) => npm_1.api.isLessThanRange(composer2npm(version), composer2npm(range));
const isSingleVersion = (input) => input && npm_1.api.isSingleVersion(composer2npm(input));
const isStable = (version) => version && npm_1.api.isStable(composer2npm(version));
exports.isValid = (input) => input && npm_1.api.isValid(composer2npm(input));
exports.isVersion = (input) => input && npm_1.api.isVersion(composer2npm(input));
const matches = (version, range) => npm_1.api.matches(composer2npm(version), composer2npm(range));
const maxSatisfyingVersion = (versions, range) => npm_1.api.maxSatisfyingVersion(versions.map(composer2npm), composer2npm(range));
const minSatisfyingVersion = (versions, range) => npm_1.api.minSatisfyingVersion(versions.map(composer2npm), composer2npm(range));
function getNewValue({ currentValue, rangeStrategy, fromVersion, toVersion, }) {
    if (rangeStrategy === 'pin') {
        return toVersion;
    }
    const toMajor = getMajor(toVersion);
    const toMinor = getMinor(toVersion);
    let newValue;
    if (exports.isVersion(currentValue)) {
        newValue = toVersion;
    }
    else if (/^[~^](0\.[1-9][0-9]*)$/.test(currentValue)) {
        const operator = currentValue.substr(0, 1);
        // handle ~0.4 case first
        if (toMajor === 0) {
            newValue = `${operator}0.${toMinor}`;
        }
        else {
            newValue = `${operator}${toMajor}.0`;
        }
    }
    else if (/^[~^]([0-9]*)$/.test(currentValue)) {
        // handle ~4 case
        const operator = currentValue.substr(0, 1);
        newValue = `${operator}${toMajor}`;
    }
    else if (/^[~^]([0-9]*(?:\.[0-9]*)?)$/.test(currentValue)) {
        const operator = currentValue.substr(0, 1);
        // handle ~4.1 case
        if (fromVersion && toMajor > getMajor(fromVersion)) {
            newValue = `${operator}${toMajor}.0`;
        }
        else {
            newValue = `${operator}${toMajor}.${toMinor}`;
        }
    }
    else if (npm_1.api.isVersion(padZeroes(normalizeVersion(toVersion))) &&
        npm_1.api.isValid(normalizeVersion(currentValue)) &&
        composer2npm(currentValue) === normalizeVersion(currentValue)) {
        newValue = npm_1.api.getNewValue({
            currentValue: normalizeVersion(currentValue),
            rangeStrategy,
            fromVersion: normalizeVersion(fromVersion),
            toVersion: padZeroes(normalizeVersion(toVersion)),
        });
    }
    if (currentValue.includes(' || ')) {
        const lastValue = currentValue.split('||').pop().trim();
        const replacementValue = getNewValue({
            currentValue: lastValue,
            rangeStrategy,
            fromVersion,
            toVersion,
        });
        if (rangeStrategy === 'replace') {
            newValue = replacementValue;
        }
        else if (rangeStrategy === 'widen') {
            newValue = currentValue + ' || ' + replacementValue;
        }
    }
    if (!newValue) {
        logger_1.logger.warn({ currentValue, rangeStrategy, fromVersion, toVersion }, 'Unsupported composer value');
        newValue = toVersion;
    }
    if (currentValue.split('.')[0].includes('v')) {
        newValue = newValue.replace(/([0-9])/, 'v$1');
    }
    // Preserve original min-stability specifier
    if (currentValue.includes('@')) {
        newValue += '@' + currentValue.split('@')[1];
    }
    return newValue;
}
function sortVersions(a, b) {
    return npm_1.api.sortVersions(composer2npm(a), composer2npm(b));
}
exports.api = {
    equals,
    getMajor,
    getMinor,
    getPatch,
    isCompatible: exports.isVersion,
    isGreaterThan,
    isLessThanRange,
    isSingleVersion,
    isStable,
    isValid: exports.isValid,
    isVersion: exports.isVersion,
    matches,
    maxSatisfyingVersion,
    minSatisfyingVersion,
    getNewValue,
    sortVersions,
};
exports.default = exports.api;
//# sourceMappingURL=index.js.map