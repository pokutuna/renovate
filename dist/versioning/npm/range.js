"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNewValue = void 0;
const semver_1 = require("semver");
const semver_utils_1 = require("semver-utils");
const logger_1 = require("../../logger");
function getNewValue({ currentValue, rangeStrategy, fromVersion, toVersion, }) {
    if (rangeStrategy === 'pin' || semver_1.valid(currentValue)) {
        return toVersion;
    }
    if (rangeStrategy === 'update-lockfile') {
        if (semver_1.satisfies(toVersion, currentValue)) {
            return currentValue;
        }
        return getNewValue({
            currentValue,
            rangeStrategy: 'replace',
            fromVersion,
            toVersion,
        });
    }
    const parsedRange = semver_utils_1.parseRange(currentValue);
    const element = parsedRange[parsedRange.length - 1];
    if (rangeStrategy === 'widen') {
        const newValue = getNewValue({
            currentValue,
            rangeStrategy: 'replace',
            fromVersion,
            toVersion,
        });
        if (element.operator && element.operator.startsWith('<')) {
            // TODO fix this
            const splitCurrent = currentValue.split(element.operator);
            splitCurrent.pop();
            return splitCurrent.join(element.operator) + newValue;
        }
        if (parsedRange.length > 1) {
            const previousElement = parsedRange[parsedRange.length - 2];
            if (previousElement.operator === '-') {
                const splitCurrent = currentValue.split('-');
                splitCurrent.pop();
                return splitCurrent.join('-') + '- ' + newValue;
            }
            if (element.operator && element.operator.startsWith('>')) {
                logger_1.logger.warn(`Complex ranges ending in greater than are not supported`);
                return null;
            }
        }
        return `${currentValue} || ${newValue}`;
    }
    const toVersionMajor = semver_1.major(toVersion);
    const toVersionMinor = semver_1.minor(toVersion);
    const toVersionPatch = semver_1.patch(toVersion);
    const suffix = semver_1.prerelease(toVersion) ? '-' + semver_1.prerelease(toVersion)[0] : '';
    // Simple range
    if (rangeStrategy === 'bump') {
        if (parsedRange.length === 1) {
            if (!element.operator) {
                return getNewValue({
                    currentValue,
                    rangeStrategy: 'replace',
                    fromVersion,
                    toVersion,
                });
            }
            if (element.operator === '^') {
                const split = currentValue.split('.');
                if (suffix.length) {
                    return `^${toVersion}`;
                }
                if (split.length === 1) {
                    // ^4
                    return '^' + toVersionMajor;
                }
                if (split.length === 2) {
                    // ^4.1
                    return '^' + toVersionMajor + '.' + toVersionMinor;
                }
                return `^${toVersion}`;
            }
            if (element.operator === '~') {
                const split = currentValue.split('.');
                if (suffix.length) {
                    return `~${toVersion}`;
                }
                if (split.length === 1) {
                    // ~4
                    return '~' + toVersionMajor;
                }
                if (split.length === 2) {
                    // ~4.1
                    return '~' + toVersionMajor + '.' + toVersionMinor;
                }
                return `~${toVersion}`;
            }
            if (element.operator === '=') {
                return `=${toVersion}`;
            }
            if (element.operator === '>=') {
                return currentValue.includes('>= ')
                    ? `>= ${toVersion}`
                    : `>=${toVersion}`;
            }
            if (element.operator.startsWith('<')) {
                return currentValue;
            }
        }
        logger_1.logger.debug('Unsupported range type for rangeStrategy=bump: ' + currentValue);
        return null;
    }
    if (element.operator === '~>') {
        return `~> ${toVersionMajor}.${toVersionMinor}.0`;
    }
    if (element.operator === '^') {
        if (suffix.length || !fromVersion) {
            return `^${toVersionMajor}.${toVersionMinor}.${toVersionPatch}${suffix}`;
        }
        if (toVersionMajor === semver_1.major(fromVersion)) {
            if (toVersionMajor === 0) {
                if (toVersionMinor === 0) {
                    return `^${toVersion}`;
                }
                return `^${toVersionMajor}.${toVersionMinor}.0`;
            }
            return `^${toVersion}`;
        }
        return `^${toVersionMajor}.0.0`;
    }
    if (element.operator === '=') {
        return `=${toVersion}`;
    }
    if (element.operator === '~') {
        if (suffix.length) {
            return `~${toVersionMajor}.${toVersionMinor}.${toVersionPatch}${suffix}`;
        }
        return `~${toVersionMajor}.${toVersionMinor}.0`;
    }
    if (element.operator === '<=') {
        let res;
        if (element.patch || suffix.length) {
            res = `<=${toVersion}`;
        }
        else if (element.minor) {
            res = `<=${toVersionMajor}.${toVersionMinor}`;
        }
        else {
            res = `<=${toVersionMajor}`;
        }
        if (currentValue.includes('<= ')) {
            res = res.replace('<=', '<= ');
        }
        return res;
    }
    if (element.operator === '<') {
        let res;
        if (currentValue.endsWith('.0.0')) {
            const newMajor = toVersionMajor + 1;
            res = `<${newMajor}.0.0`;
        }
        else if (element.patch) {
            res = `<${semver_1.inc(toVersion, 'patch')}`;
        }
        else if (element.minor) {
            res = `<${toVersionMajor}.${toVersionMinor + 1}`;
        }
        else {
            res = `<${toVersionMajor + 1}`;
        }
        if (currentValue.includes('< ')) {
            res = res.replace(/</g, '< ');
        }
        return res;
    }
    if (!element.operator) {
        if (element.minor) {
            if (element.minor === 'x') {
                return `${toVersionMajor}.x`;
            }
            if (element.minor === '*') {
                return `${toVersionMajor}.*`;
            }
            if (element.patch === 'x') {
                return `${toVersionMajor}.${toVersionMinor}.x`;
            }
            if (element.patch === '*') {
                return `${toVersionMajor}.${toVersionMinor}.*`;
            }
            return `${toVersionMajor}.${toVersionMinor}`;
        }
        return `${toVersionMajor}`;
    }
    return toVersion;
}
exports.getNewValue = getNewValue;
//# sourceMappingURL=range.js.map