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
exports.api = exports.supportsRanges = exports.urls = exports.displayName = exports.id = void 0;
const generic = __importStar(require("../loose/generic"));
exports.id = 'docker';
exports.displayName = 'Docker';
exports.urls = [
    'https://docs.docker.com/engine/reference/commandline/tag/',
];
exports.supportsRanges = false;
const versionPattern = /^(?<version>\d+(?:\.\d+)*)(?<prerelease>.*)$/;
const commitHashPattern = /^[a-f0-9]{7,40}$/;
const numericPattern = /^[0-9]+$/;
function parse(version) {
    if (commitHashPattern.test(version) && !numericPattern.test(version)) {
        return null;
    }
    const versionPieces = version.replace(/^v/, '').split('-');
    const prefix = versionPieces.shift();
    const suffix = versionPieces.join('-');
    const m = versionPattern.exec(prefix);
    if (!(m === null || m === void 0 ? void 0 : m.groups)) {
        return null;
    }
    const { version: ver, prerelease } = m.groups;
    const release = ver.split('.').map(Number);
    return { release, suffix, prerelease };
}
function valueToVersion(value) {
    // Remove any suffix after '-', e.g. '-alpine'
    return value ? value.split('-')[0] : value;
}
function compare(version1, vervion2) {
    const parsed1 = parse(version1);
    const parsed2 = parse(vervion2);
    // istanbul ignore if
    if (!(parsed1 && parsed2)) {
        return 1;
    }
    const length = Math.max(parsed1.release.length, parsed2.release.length);
    for (let i = 0; i < length; i += 1) {
        const part1 = parsed1.release[i];
        const part2 = parsed2.release[i];
        // shorter is bigger 2.1 > 2.1.1
        if (part1 === undefined) {
            return 1;
        }
        if (part2 === undefined) {
            return -1;
        }
        if (part1 !== part2) {
            return part1 - part2;
        }
    }
    if (parsed1.prerelease !== parsed2.prerelease) {
        // unstable is lower
        if (!parsed1.prerelease && parsed2.prerelease) {
            return 1;
        }
        if (parsed1.prerelease && !parsed2.prerelease) {
            return -1;
        }
        // alphabetic order
        return parsed1.prerelease.localeCompare(parsed2.prerelease);
    }
    // equals
    return parsed2.suffix.localeCompare(parsed1.suffix);
}
function isCompatible(version, range) {
    const parsed1 = parse(version);
    const parsed2 = parse(range);
    return (parsed1.suffix === parsed2.suffix &&
        parsed1.release.length === parsed2.release.length);
}
exports.api = {
    ...generic.create({
        parse,
        compare,
    }),
    isCompatible,
    valueToVersion,
};
exports.default = exports.api;
//# sourceMappingURL=index.js.map