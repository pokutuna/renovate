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
exports.getDigest = exports.getReleases = exports.id = void 0;
const semver = __importStar(require("../../versioning/semver"));
const gitRefs = __importStar(require("../git-refs"));
exports.id = 'git-tags';
async function getReleases({ lookupName, }) {
    const rawRefs = await gitRefs.getRawRefs({ lookupName });
    if (rawRefs === null) {
        return null;
    }
    const releases = rawRefs
        .filter((ref) => ref.type === 'tags')
        .filter((ref) => semver.isVersion(ref.value))
        .map((ref) => ({
        version: ref.value,
        gitRef: ref.value,
        newDigest: ref.hash,
    }));
    const sourceUrl = lookupName.replace(/\.git$/, '').replace(/\/$/, '');
    const result = {
        sourceUrl,
        releases,
    };
    return result;
}
exports.getReleases = getReleases;
async function getDigest({ lookupName }, newValue) {
    const rawRefs = await gitRefs.getRawRefs({ lookupName });
    const findValue = newValue || 'HEAD';
    const ref = rawRefs.find((rawRef) => rawRef.value === findValue);
    if (ref) {
        return ref.hash;
    }
    return null;
}
exports.getDigest = getDigest;
//# sourceMappingURL=index.js.map