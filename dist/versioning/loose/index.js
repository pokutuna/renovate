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
const generic = __importStar(require("./generic"));
exports.id = 'loose';
exports.displayName = 'Loose';
exports.urls = [];
exports.supportsRanges = false;
const versionPattern = /^v?(\d+(?:\.\d+)*)(.*)$/;
const commitHashPattern = /^[a-f0-9]{7,40}$/;
const numericPattern = /^[0-9]+$/;
function parse(version) {
    if (commitHashPattern.test(version) && !numericPattern.test(version)) {
        return null;
    }
    const matches = versionPattern.exec(version);
    if (!matches) {
        return null;
    }
    const [, prefix, suffix] = matches;
    const release = prefix.split('.').map(Number);
    if (release.length > 6) {
        return null;
    }
    return { release, suffix: suffix || '' };
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
        // shorter is smaller 2.1 < 2.1.0
        if (part1 === undefined) {
            return -1;
        }
        if (part2 === undefined) {
            return 1;
        }
        if (part1 !== part2) {
            return part1 - part2;
        }
    }
    // equals
    return parsed1.suffix.localeCompare(parsed2.suffix);
}
exports.api = generic.create({
    parse,
    compare,
});
exports.default = exports.api;
//# sourceMappingURL=index.js.map