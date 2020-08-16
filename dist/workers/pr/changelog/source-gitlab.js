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
exports.getChangeLogJSON = void 0;
const url_1 = __importDefault(require("url"));
const logger_1 = require("../../../logger");
const memCache = __importStar(require("../../../util/cache/memory"));
const packageCache = __importStar(require("../../../util/cache/package"));
const regex_1 = require("../../../util/regex");
const allVersioning = __importStar(require("../../../versioning"));
const gitlab_1 = require("./gitlab");
const release_notes_1 = require("./release-notes");
const cacheNamespace = 'changelog-gitlab-release';
function getCachedTags(endpoint, versionScheme, repository) {
    const cacheKey = `getTags-${endpoint}-${versionScheme}-${repository}`;
    const cachedResult = memCache.get(cacheKey);
    // istanbul ignore if
    if (cachedResult !== undefined) {
        return cachedResult;
    }
    const promisedRes = gitlab_1.getTags(endpoint, repository);
    memCache.set(cacheKey, promisedRes);
    return promisedRes;
}
async function getChangeLogJSON({ versioning, fromVersion, toVersion, sourceUrl, releases, depName, manager, }) {
    logger_1.logger.trace('getChangeLogJSON for gitlab');
    const version = allVersioning.get(versioning);
    const { protocol, host, pathname } = url_1.default.parse(sourceUrl);
    logger_1.logger.trace({ protocol, host, pathname }, 'Protocol, host, pathname');
    const baseUrl = protocol.concat('//', host, '/');
    const apiBaseUrl = baseUrl.concat('api/v4/');
    const repository = pathname
        .slice(1)
        .replace(/\/$/, '')
        .replace(/\.git$/, '');
    if (repository.split('/').length < 2) {
        logger_1.logger.info({ sourceUrl }, 'Invalid gitlab URL found');
        return null;
    }
    if (!(releases === null || releases === void 0 ? void 0 : releases.length)) {
        logger_1.logger.debug('No releases');
        return null;
    }
    // This extra filter/sort should not be necessary, but better safe than sorry
    const validReleases = [...releases]
        .filter((release) => version.isVersion(release.version))
        .sort((a, b) => version.sortVersions(a.version, b.version));
    if (validReleases.length < 2) {
        logger_1.logger.debug('Not enough valid releases');
        return null;
    }
    let tags;
    async function getRef(release) {
        if (!tags) {
            tags = await getCachedTags(apiBaseUrl, versioning, repository);
        }
        const regex = regex_1.regEx(`(?:${depName}|release)[@-]`);
        const tagName = tags
            .filter((tag) => version.isVersion(tag.replace(regex, '')))
            .find((tag) => version.equals(tag.replace(regex, ''), release.version));
        if (tagName) {
            return tagName;
        }
        if (release.gitRef) {
            return release.gitRef;
        }
        return null;
    }
    function getCacheKey(prev, next) {
        return `${manager}:${depName}:${prev}:${next}`;
    }
    const changelogReleases = [];
    // compare versions
    const include = (v) => version.isGreaterThan(v, fromVersion) &&
        !version.isGreaterThan(v, toVersion);
    for (let i = 1; i < validReleases.length; i += 1) {
        const prev = validReleases[i - 1];
        const next = validReleases[i];
        if (include(next.version)) {
            let release = await packageCache.get(cacheNamespace, getCacheKey(prev.version, next.version));
            if (!release) {
                release = {
                    version: next.version,
                    date: next.releaseTimestamp,
                    // put empty changes so that existing templates won't break
                    changes: [],
                    compare: {},
                };
                const prevHead = await getRef(prev);
                const nextHead = await getRef(next);
                if (prevHead && nextHead) {
                    release.compare.url = `${baseUrl}${repository}/compare/${prevHead}...${nextHead}`;
                }
                const cacheMinutes = 55;
                await packageCache.set(cacheNamespace, getCacheKey(prev.version, next.version), release, cacheMinutes);
            }
            changelogReleases.unshift(release);
        }
    }
    let res = {
        project: {
            apiBaseUrl,
            baseUrl,
            gitlab: repository,
            repository: sourceUrl,
            depName,
        },
        versions: changelogReleases,
    };
    res = await release_notes_1.addReleaseNotes(res);
    return res;
}
exports.getChangeLogJSON = getChangeLogJSON;
//# sourceMappingURL=source-gitlab.js.map