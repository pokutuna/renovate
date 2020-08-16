"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.sortVersions = exports.matches = exports.isValid = exports.isVersion = exports.supportedRangeStrategies = exports.supportsRanges = exports.urls = exports.displayName = exports.id = void 0;
const ruby_semver_1 = require("@renovatebot/ruby-semver");
const logger_1 = require("../../logger");
const operator_1 = require("./operator");
const range_1 = require("./range");
const strategies_1 = require("./strategies");
const version_1 = require("./version");
exports.id = 'ruby';
exports.displayName = 'Ruby';
exports.urls = [
    'https://guides.rubygems.org/patterns/',
    'https://bundler.io/v1.5/gemfile.html',
    'https://www.devalot.com/articles/2012/04/gem-versions.html',
];
exports.supportsRanges = true;
exports.supportedRangeStrategies = ['bump', 'extend', 'pin', 'replace'];
function vtrim(version) {
    if (typeof version === 'string') {
        return version.replace(/^v/, '').replace(/('|")/g, '');
    }
    return version;
}
const equals = (left, right) => ruby_semver_1.eq(vtrim(left), vtrim(right));
const getMajor = (version) => version_1.parse(vtrim(version)).major;
const getMinor = (version) => version_1.parse(vtrim(version)).minor;
const getPatch = (version) => version_1.parse(vtrim(version)).patch;
exports.isVersion = (version) => !!ruby_semver_1.valid(vtrim(version));
const isGreaterThan = (left, right) => ruby_semver_1.gt(vtrim(left), vtrim(right));
const isLessThanRange = (version, range) => range_1.ltr(vtrim(version), vtrim(range));
const isSingleVersion = (range) => {
    const { version, operator } = range_1.parse(vtrim(range));
    return operator
        ? exports.isVersion(version) && operator_1.isSingleOperator(operator)
        : exports.isVersion(version);
};
function isStable(version) {
    const v = vtrim(version);
    return version_1.parse(v).prerelease ? false : exports.isVersion(v);
}
exports.isValid = (input) => input
    .split(',')
    .map((piece) => vtrim(piece.trim()))
    .every((range) => {
    const { version, operator } = range_1.parse(range);
    return operator
        ? exports.isVersion(version) && operator_1.isValidOperator(operator)
        : exports.isVersion(version);
});
exports.matches = (version, range) => ruby_semver_1.satisfies(vtrim(version), vtrim(range));
const maxSatisfyingVersion = (versions, range) => ruby_semver_1.maxSatisfying(versions.map(vtrim), vtrim(range));
const minSatisfyingVersion = (versions, range) => ruby_semver_1.minSatisfying(versions.map(vtrim), vtrim(range));
const getNewValue = ({ currentValue, rangeStrategy, fromVersion, toVersion, }) => {
    let newValue = null;
    if (exports.isVersion(currentValue)) {
        newValue = currentValue.startsWith('v') ? 'v' + toVersion : toVersion;
    }
    else if (currentValue.replace(/^=\s*/, '') === fromVersion) {
        newValue = currentValue.replace(fromVersion, toVersion);
    }
    else {
        switch (rangeStrategy) {
            case 'update-lockfile':
                if (ruby_semver_1.satisfies(toVersion, currentValue)) {
                    newValue = currentValue;
                }
                else {
                    newValue = getNewValue({
                        currentValue,
                        rangeStrategy: 'replace',
                        fromVersion,
                        toVersion,
                    });
                }
                break;
            case 'pin':
                newValue = strategies_1.pin({ to: vtrim(toVersion) });
                break;
            case 'bump':
                newValue = strategies_1.bump({ range: vtrim(currentValue), to: vtrim(toVersion) });
                break;
            case 'replace':
                newValue = strategies_1.replace({
                    range: vtrim(currentValue),
                    to: vtrim(toVersion),
                });
                break;
            // istanbul ignore next
            default:
                logger_1.logger.warn(`Unsupported strategy ${rangeStrategy}`);
        }
    }
    if (/^('|")/.exec(currentValue)) {
        const delimiter = currentValue[0];
        return newValue
            .split(',')
            .map((element) => element.replace(/^(\s*)/, `$1${delimiter}`))
            .map((element) => element.replace(/(\s*)$/, `${delimiter}$1`))
            .join(',');
    }
    return newValue;
};
exports.sortVersions = (left, right) => ruby_semver_1.gt(vtrim(left), vtrim(right)) ? 1 : -1;
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
    matches: exports.matches,
    maxSatisfyingVersion,
    minSatisfyingVersion,
    getNewValue,
    sortVersions: exports.sortVersions,
};
exports.default = exports.api;
//# sourceMappingURL=index.js.map