"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isVersion = exports.api = exports.isValid = exports.supportedRangeStrategies = exports.supportsRanges = exports.urls = exports.displayName = exports.id = void 0;
const npm_1 = require("../npm");
exports.id = 'hashicorp';
exports.displayName = 'Hashicorp';
exports.urls = [
    'https://www.terraform.io/docs/configuration/terraform.html#specifying-a-required-terraform-version',
];
exports.supportsRanges = true;
exports.supportedRangeStrategies = ['bump', 'extend', 'pin', 'replace'];
function hashicorp2npm(input) {
    // The only case incompatible with semver is a "short" ~>, e.g. ~> 1.2
    return input.replace(/~>(\s*\d+\.\d+$)/, '^$1').replace(',', '');
}
const isLessThanRange = (version, range) => npm_1.api.isLessThanRange(hashicorp2npm(version), hashicorp2npm(range));
exports.isValid = (input) => input && npm_1.api.isValid(hashicorp2npm(input));
const matches = (version, range) => npm_1.api.matches(hashicorp2npm(version), hashicorp2npm(range));
const maxSatisfyingVersion = (versions, range) => npm_1.api.maxSatisfyingVersion(versions.map(hashicorp2npm), hashicorp2npm(range));
const minSatisfyingVersion = (versions, range) => npm_1.api.minSatisfyingVersion(versions.map(hashicorp2npm), hashicorp2npm(range));
function getNewValue({ currentValue, rangeStrategy, fromVersion, toVersion, }) {
    // handle specia. ~> 1.2 case
    if (/(~>\s*)\d+\.\d+$/.test(currentValue)) {
        return currentValue.replace(/(~>\s*)\d+\.\d+$/, `$1${npm_1.api.getMajor(toVersion)}.0`);
    }
    return npm_1.api.getNewValue({
        currentValue,
        rangeStrategy,
        fromVersion,
        toVersion,
    });
}
exports.api = {
    ...npm_1.api,
    isLessThanRange,
    isValid: exports.isValid,
    matches,
    maxSatisfyingVersion,
    minSatisfyingVersion,
    getNewValue,
};
// eslint-disable-next-line @typescript-eslint/unbound-method
exports.isVersion = exports.api.isVersion;
exports.default = exports.api;
//# sourceMappingURL=index.js.map