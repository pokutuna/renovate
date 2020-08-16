"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.isValid = exports.supportedRangeStrategies = exports.supportsRanges = exports.urls = exports.displayName = exports.id = void 0;
const npm_1 = require("../npm");
exports.id = 'hex';
exports.displayName = 'Hex';
exports.urls = ['https://hexdocs.pm/elixir/Version.html'];
exports.supportsRanges = true;
exports.supportedRangeStrategies = ['bump', 'extend', 'pin', 'replace'];
function hex2npm(input) {
    return input
        .replace(/~>\s*(\d+\.\d+)$/, '^$1')
        .replace(/~>\s*(\d+\.\d+\.\d+)/, '~$1')
        .replace(/==|and/, '')
        .replace('or', '||')
        .replace(/!=\s*(\d+\.\d+(\.\d+.*)?)/, '>$1 <$1')
        .trim();
}
function npm2hex(input) {
    const res = input
        .split(' ')
        .map((str) => str.trim())
        .filter((str) => str !== '');
    let output = '';
    const operators = ['^', '=', '>', '<', '<=', '>=', '~'];
    for (let i = 0; i < res.length; i += 1) {
        if (i === res.length - 1) {
            output += res[i];
            break;
        }
        if (i < res.length - 1 && res[i + 1].includes('||')) {
            output += res[i] + ' or ';
            i += 1;
        }
        else if (!operators.includes(res[i])) {
            output += res[i] + ' and ';
        }
        else {
            output += res[i] + ' ';
        }
    }
    return output;
}
const isLessThanRange = (version, range) => npm_1.api.isLessThanRange(hex2npm(version), hex2npm(range));
const isValid = (input) => npm_1.api.isValid(hex2npm(input));
exports.isValid = isValid;
const matches = (version, range) => npm_1.api.matches(hex2npm(version), hex2npm(range));
const maxSatisfyingVersion = (versions, range) => npm_1.api.maxSatisfyingVersion(versions.map(hex2npm), hex2npm(range));
const minSatisfyingVersion = (versions, range) => npm_1.api.minSatisfyingVersion(versions.map(hex2npm), hex2npm(range));
const getNewValue = ({ currentValue, rangeStrategy, fromVersion, toVersion, }) => {
    let newSemver = npm_1.api.getNewValue({
        currentValue: hex2npm(currentValue),
        rangeStrategy,
        fromVersion,
        toVersion,
    });
    newSemver = npm2hex(newSemver);
    if (/~>\s*(\d+\.\d+)$/.test(currentValue)) {
        newSemver = newSemver.replace(/\^\s*(\d+\.\d+(\.\d)?)/, (_str, p1) => '~> ' + p1.slice(0, -2));
    }
    else {
        newSemver = newSemver.replace(/~\s*(\d+\.\d+\.\d)/, '~> $1');
    }
    if (npm_1.api.isVersion(newSemver)) {
        newSemver = `== ${newSemver}`;
    }
    return newSemver;
};
exports.api = {
    ...npm_1.api,
    isLessThanRange,
    isValid,
    matches,
    maxSatisfyingVersion,
    minSatisfyingVersion,
    getNewValue,
};
exports.default = exports.api;
//# sourceMappingURL=index.js.map