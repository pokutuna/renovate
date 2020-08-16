"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNewValue = exports.toSemverRange = void 0;
const semver_1 = __importDefault(require("semver"));
const fromParam = /^\s*from\s*:\s*"([^"]+)"\s*$/;
const fromRange = /^\s*"([^"]+)"\s*\.\.\.\s*$/;
const binaryRange = /^\s*"([^"]+)"\s*(\.\.[.<])\s*"([^"]+)"\s*$/;
const toRange = /^\s*(\.\.[.<])\s*"([^"]+)"\s*$/;
function toSemverRange(range) {
    if (fromParam.test(range)) {
        const [, version] = fromParam.exec(range);
        if (semver_1.default.valid(version)) {
            const nextMajor = `${semver_1.default.major(version) + 1}.0.0`;
            return `>=${version} <${nextMajor}`;
        }
    }
    else if (fromRange.test(range)) {
        const [, version] = fromRange.exec(range);
        if (semver_1.default.valid(version)) {
            return `>=${version}`;
        }
    }
    else if (binaryRange.test(range)) {
        const [, fromVersion, op, toVersion] = binaryRange.exec(range);
        if (semver_1.default.valid(fromVersion) && semver_1.default.valid(toVersion)) {
            return op === '..<'
                ? `>=${fromVersion} <${toVersion}`
                : `>=${fromVersion} <=${toVersion}`;
        }
    }
    else if (toRange.test(range)) {
        const [, op, toVersion] = toRange.exec(range);
        if (semver_1.default.valid(toVersion)) {
            return op === '..<' ? `<${toVersion}` : `<=${toVersion}`;
        }
    }
    return null;
}
exports.toSemverRange = toSemverRange;
function getNewValue({ currentValue, fromVersion, toVersion, }) {
    if (fromParam.test(currentValue)) {
        return currentValue.replace(/".*?"/, `"${toVersion}"`);
    }
    if (fromRange.test(currentValue)) {
        const [, version] = fromRange.exec(currentValue);
        return currentValue.replace(version, toVersion);
    }
    if (binaryRange.test(currentValue)) {
        const [, , , version] = binaryRange.exec(currentValue);
        return currentValue.replace(version, toVersion);
    }
    if (toRange.test(currentValue)) {
        const [, , version] = toRange.exec(currentValue);
        return currentValue.replace(version, toVersion);
    }
    return currentValue;
}
exports.getNewValue = getNewValue;
//# sourceMappingURL=range.js.map