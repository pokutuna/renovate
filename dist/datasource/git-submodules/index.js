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
exports.getDigest = exports.getReleases = exports.defaultConfig = exports.id = void 0;
const url_1 = require("url");
const simple_git_1 = __importDefault(require("simple-git"));
const packageCache = __importStar(require("../../util/cache/package"));
exports.id = 'git-submodules';
exports.defaultConfig = {
    pinDigests: false,
};
async function getReleases({ lookupName, registryUrls, }) {
    const cacheNamespace = 'datasource-git-submodules';
    const cacheKey = `${registryUrls[0]}-${registryUrls[1]}`;
    const cachedResult = await packageCache.get(cacheNamespace, cacheKey);
    // istanbul ignore if
    if (cachedResult) {
        return cachedResult;
    }
    const git = simple_git_1.default();
    const newHash = (await git.listRemote(['--refs', registryUrls[0], registryUrls[1]]))
        .trim()
        .split(/\t/)[0];
    const sourceUrl = new url_1.URL(registryUrls[0]);
    sourceUrl.username = '';
    const result = {
        sourceUrl: sourceUrl.href,
        releases: [
            {
                version: newHash,
            },
        ],
    };
    const cacheMinutes = 60;
    await packageCache.set(cacheNamespace, cacheKey, result, cacheMinutes);
    return result;
}
exports.getReleases = getReleases;
exports.getDigest = (config, newValue) => new Promise((resolve) => resolve(newValue));
//# sourceMappingURL=index.js.map