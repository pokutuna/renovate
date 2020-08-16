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
exports.id = 'nuget';
exports.displayName = 'NuGet';
exports.urls = [
    'https://docs.microsoft.com/en-us/nuget/concepts/package-versioning',
];
exports.supportsRanges = false;
const pattern = /^(\d+(?:\.\d+)*)(-[^+]+)?(\+.*)?$/;
function parse(version) {
    const matches = pattern.exec(version);
    if (!matches) {
        return null;
    }
    const [, prefix, prereleasesuffix] = matches;
    const release = prefix.split('.').map(Number);
    return { release, suffix: prereleasesuffix || '' };
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
        // 2.1 and 2.1.0 are equivalent
        const part1 = parsed1.release[i] || 0;
        const part2 = parsed2.release[i] || 0;
        if (part1 !== part2) {
            return part1 - part2;
        }
    }
    // numeric version equals
    const suffixComparison = parsed1.suffix.localeCompare(parsed2.suffix);
    if (suffixComparison !== 0) {
        // Empty suffix should compare greater than non-empty suffix
        if (parsed1.suffix === '') {
            return 1;
        }
        if (parsed2.suffix === '') {
            return -1;
        }
    }
    return suffixComparison;
}
function isStable(version) {
    const parsed = parse(version);
    return parsed && parsed.suffix === '';
}
exports.api = {
    ...generic.create({
        parse,
        compare,
    }),
    isStable,
};
exports.default = exports.api;
//# sourceMappingURL=index.js.map