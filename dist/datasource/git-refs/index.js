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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDigest = exports.getReleases = exports.getRawRefs = exports.id = void 0;
const simple_git_1 = __importDefault(require("simple-git"));
const packageCache = __importStar(require("../../util/cache/package"));
const semver = __importStar(require("../../versioning/semver"));
exports.id = 'git-refs';
const cacheMinutes = 10;
// git will prompt for known hosts or passwords, unless we activate BatchMode
process.env.GIT_SSH_COMMAND = 'ssh -o BatchMode=yes';
async function getRawRefs({ lookupName, }) {
    const git = simple_git_1.default();
    const cacheNamespace = 'git-raw-refs';
    const cachedResult = await packageCache.get(cacheNamespace, lookupName);
    /* istanbul ignore next line */
    if (cachedResult) {
        return cachedResult;
    }
    // fetch remote tags
    const lsRemote = await git.listRemote([lookupName]);
    if (!lsRemote) {
        return null;
    }
    const refMatch = /(?<hash>.*?)\s+refs\/(?<type>.*?)\/(?<value>.*)/;
    const headMatch = /(?<hash>.*?)\s+HEAD/;
    const refs = lsRemote
        .trim()
        .split('\n')
        .map((line) => line.trim())
        .map((line) => {
        let match = refMatch.exec(line);
        if (match) {
            return {
                type: match.groups.type,
                value: match.groups.value,
                hash: match.groups.hash,
            };
        }
        match = headMatch.exec(line);
        if (match) {
            return {
                type: '',
                value: 'HEAD',
                hash: match.groups.hash,
            };
        }
        // istanbul ignore next
        return null;
    })
        .filter(Boolean)
        .filter((ref) => ref.type !== 'pull' && !ref.value.endsWith('^{}'));
    await packageCache.set(cacheNamespace, lookupName, refs, cacheMinutes);
    return refs;
}
exports.getRawRefs = getRawRefs;
async function getReleases({ lookupName, }) {
    const rawRefs = await getRawRefs({ lookupName });
    const refs = rawRefs
        .filter((ref) => ref.type === 'tags' || ref.type === 'heads')
        .map((ref) => ref.value)
        .filter((ref) => semver.isVersion(ref));
    const uniqueRefs = [...new Set(refs)];
    const sourceUrl = lookupName.replace(/\.git$/, '').replace(/\/$/, '');
    const result = {
        sourceUrl,
        releases: uniqueRefs.map((ref) => ({
            version: ref,
            gitRef: ref,
            newDigest: rawRefs.find((rawRef) => rawRef.value === ref).hash,
        })),
    };
    return result;
}
exports.getReleases = getReleases;
async function getDigest({ lookupName }, newValue) {
    const rawRefs = await getRawRefs({ lookupName });
    const findValue = newValue || 'HEAD';
    const ref = rawRefs.find((rawRef) => rawRef.value === findValue);
    if (ref) {
        return ref.hash;
    }
    return null;
}
exports.getDigest = getDigest;
//# sourceMappingURL=index.js.map