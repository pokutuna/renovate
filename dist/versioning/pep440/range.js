"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNewValue = void 0;
const pep440_1 = require("@renovate/pep440");
const specifier_1 = require("@renovate/pep440/lib/specifier");
const version_1 = require("@renovate/pep440/lib/version");
const logger_1 = require("../../logger");
function getFutureVersion(baseVersion, toVersion, step) {
    const toRelease = version_1.parse(toVersion).release;
    const baseRelease = version_1.parse(baseVersion).release;
    let found = false;
    const futureRelease = baseRelease.map((basePart, index) => {
        if (found) {
            return 0;
        }
        const toPart = toRelease[index] || 0;
        if (toPart > basePart) {
            found = true;
            return toPart + step;
        }
        return toPart;
    });
    if (!found) {
        futureRelease[futureRelease.length - 1] += step;
    }
    return futureRelease.join('.');
}
function getNewValue({ currentValue, rangeStrategy, fromVersion, toVersion, }) {
    // easy pin
    if (rangeStrategy === 'pin') {
        return '==' + toVersion;
    }
    if (currentValue === fromVersion) {
        return toVersion;
    }
    const ranges = specifier_1.parse(currentValue);
    if (!ranges) {
        logger_1.logger.warn('Invalid currentValue: ' + currentValue);
        return null;
    }
    if (!ranges.length) {
        // an empty string is an allowed value for PEP440 range
        // it means get any version
        logger_1.logger.warn('Empty currentValue: ' + currentValue);
        return currentValue;
    }
    if (rangeStrategy === 'replace') {
        if (pep440_1.satisfies(toVersion, currentValue)) {
            return currentValue;
        }
    }
    if (!['replace', 'bump'].includes(rangeStrategy)) {
        logger_1.logger.debug('Unsupported rangeStrategy: ' +
            rangeStrategy +
            '. Using "replace" instead.');
        return getNewValue({
            currentValue,
            rangeStrategy: 'replace',
            fromVersion,
            toVersion,
        });
    }
    if (ranges.some((range) => range.operator === '===')) {
        // the operator "===" is used for legacy non PEP440 versions
        logger_1.logger.warn('Arbitrary equality not supported: ' + currentValue);
        return null;
    }
    let result = ranges
        .map((range) => {
        // used to exclude versions,
        // we assume that's for a good reason
        if (range.operator === '!=') {
            return range.operator + range.version;
        }
        // used to mark minimum supported version
        if (['>', '>='].includes(range.operator)) {
            if (pep440_1.lte(toVersion, range.version)) {
                // this looks like a rollback
                return '>=' + toVersion;
            }
            // this is similar to ~=
            if (rangeStrategy === 'bump' && range.operator === '>=') {
                return range.operator + toVersion;
            }
            // otherwise treat it same as exclude
            return range.operator + range.version;
        }
        // this is used to exclude future versions
        if (range.operator === '<') {
            // if toVersion is that future version
            if (pep440_1.gte(toVersion, range.version)) {
                // now here things get tricky
                // we calculate the new future version
                const futureVersion = getFutureVersion(range.version, toVersion, 1);
                return range.operator + futureVersion;
            }
            // otherwise treat it same as exclude
            return range.operator + range.version;
        }
        // keep the .* suffix
        if (range.prefix) {
            const futureVersion = getFutureVersion(range.version, toVersion, 0);
            return range.operator + futureVersion + '.*';
        }
        if (['==', '~=', '<='].includes(range.operator)) {
            return range.operator + toVersion;
        }
        // unless PEP440 changes, this won't happen
        // istanbul ignore next
        logger_1.logger.error({ toVersion, currentValue, range }, 'pep440: failed to process range');
        // istanbul ignore next
        return null;
    })
        .filter(Boolean)
        .join(', ');
    if (result.includes(', ') && !currentValue.includes(', ')) {
        result = result.replace(/, /g, ',');
    }
    if (!pep440_1.satisfies(toVersion, result)) {
        // we failed at creating the range
        logger_1.logger.error({ result, toVersion, currentValue }, 'pep440: failed to calcuate newValue');
        return null;
    }
    return result;
}
exports.getNewValue = getNewValue;
//# sourceMappingURL=range.js.map