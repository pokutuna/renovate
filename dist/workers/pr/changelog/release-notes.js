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
exports.addReleaseNotes = exports.getReleaseNotesMd = exports.getReleaseNotesMdFile = exports.getReleaseNotesMdFileInner = exports.getReleaseNotes = exports.massageBody = exports.getCachedReleaseList = exports.getReleaseList = void 0;
const URL = __importStar(require("url"));
const linkify_markdown_1 = require("linkify-markdown");
const markdown_it_1 = __importDefault(require("markdown-it"));
const logger_1 = require("../../../logger");
const memCache = __importStar(require("../../../util/cache/memory"));
const packageCache = __importStar(require("../../../util/cache/package"));
const github = __importStar(require("./github"));
const gitlab = __importStar(require("./gitlab"));
const markdown = new markdown_it_1.default('zero');
markdown.enable(['heading', 'lheading']);
async function getReleaseList(apiBaseUrl, repository) {
    logger_1.logger.trace('getReleaseList()');
    // istanbul ignore if
    if (!apiBaseUrl) {
        logger_1.logger.debug('No apiBaseUrl');
        return [];
    }
    try {
        if (apiBaseUrl.includes('gitlab')) {
            return await gitlab.getReleaseList(apiBaseUrl, repository);
        }
        return await github.getReleaseList(apiBaseUrl, repository);
    }
    catch (err) /* istanbul ignore next */ {
        if (err.statusCode === 404) {
            logger_1.logger.debug({ repository }, 'getReleaseList 404');
        }
        else {
            logger_1.logger.info({ repository, err }, 'getReleaseList error');
        }
        return [];
    }
}
exports.getReleaseList = getReleaseList;
function getCachedReleaseList(apiBaseUrl, repository) {
    const cacheKey = `getReleaseList-${apiBaseUrl}-${repository}`;
    const cachedResult = memCache.get(cacheKey);
    // istanbul ignore if
    if (cachedResult) {
        return cachedResult;
    }
    const promisedRes = getReleaseList(apiBaseUrl, repository);
    memCache.set(cacheKey, promisedRes);
    return promisedRes;
}
exports.getCachedReleaseList = getCachedReleaseList;
function massageBody(input, baseUrl) {
    let body = input || '';
    // Convert line returns
    body = body.replace(/\r\n/g, '\n');
    // semantic-release cleanup
    body = body.replace(/^<a name="[^"]*"><\/a>\n/, '');
    body = body.replace(new RegExp(`^##? \\[[^\\]]*\\]\\(${baseUrl}[^/]*\\/[^/]*\\/compare\\/.*?\\n`), '');
    // Clean-up unnecessary commits link
    body = `\n${body}\n`.replace(new RegExp(`\\n${baseUrl}[^/]+\\/[^/]+\\/compare\\/[^\\n]+(\\n|$)`), '\n');
    // Reduce headings size
    body = body
        .replace(/\n\s*####? /g, '\n##### ')
        .replace(/\n\s*## /g, '\n#### ')
        .replace(/\n\s*# /g, '\n### ');
    // Trim whitespace
    return body.trim();
}
exports.massageBody = massageBody;
async function getReleaseNotes(repository, version, depName, baseUrl, apiBaseUrl) {
    logger_1.logger.trace(`getReleaseNotes(${repository}, ${version}, ${depName})`);
    const releaseList = await getCachedReleaseList(apiBaseUrl, repository);
    logger_1.logger.trace({ releaseList }, 'Release list from getReleaseList');
    let releaseNotes = null;
    releaseList.forEach((release) => {
        if (release.tag === version ||
            release.tag === `v${version}` ||
            release.tag === `${depName}-${version}`) {
            releaseNotes = release;
            releaseNotes.url = baseUrl.includes('gitlab')
                ? `${baseUrl}${repository}/tags/${release.tag}`
                : `${baseUrl}${repository}/releases/${release.tag}`;
            releaseNotes.body = massageBody(releaseNotes.body, baseUrl);
            if (!releaseNotes.body.length) {
                releaseNotes = null;
            }
            else {
                try {
                    if (baseUrl !== 'https://gitlab.com/') {
                        releaseNotes.body = linkify_markdown_1.linkify(releaseNotes.body, {
                            repository: `${baseUrl}${repository}`,
                        });
                    }
                }
                catch (err) /* istanbul ignore next */ {
                    logger_1.logger.warn({ err, baseUrl, repository }, 'Error linkifying');
                }
            }
        }
    });
    logger_1.logger.trace({ releaseNotes });
    return releaseNotes;
}
exports.getReleaseNotes = getReleaseNotes;
function sectionize(text, level) {
    const sections = [];
    const lines = text.split('\n');
    const tokens = markdown.parse(text, undefined);
    tokens.forEach((token) => {
        if (token.type === 'heading_open') {
            const lev = +token.tag.substr(1);
            if (lev <= level) {
                sections.push([lev, token.map[0]]);
            }
        }
    });
    sections.push([-1, lines.length]);
    const result = [];
    for (let i = 1; i < sections.length; i += 1) {
        const [lev, start] = sections[i - 1];
        const [, end] = sections[i];
        if (lev === level) {
            result.push(lines.slice(start, end).join('\n'));
        }
    }
    return result;
}
function isUrl(url) {
    try {
        return !!URL.parse(url).hostname;
    }
    catch (err) {
        // istanbul ignore next
        logger_1.logger.debug({ err }, `Error parsing ${url} in URL.parse`);
    }
    // istanbul ignore next
    return false;
}
async function getReleaseNotesMdFileInner(repository, apiBaseUrl) {
    try {
        if (apiBaseUrl.includes('gitlab')) {
            return await gitlab.getReleaseNotesMd(repository, apiBaseUrl);
        }
        return await github.getReleaseNotesMd(repository, apiBaseUrl);
    }
    catch (err) /* istanbul ignore next */ {
        if (err.statusCode === 404) {
            logger_1.logger.debug('Error 404 getting changelog md');
        }
        else {
            logger_1.logger.debug({ err, repository }, 'Error getting changelog md');
        }
        return null;
    }
}
exports.getReleaseNotesMdFileInner = getReleaseNotesMdFileInner;
function getReleaseNotesMdFile(repository, apiBaseUrl) {
    const cacheKey = `getReleaseNotesMdFile-${repository}-${apiBaseUrl}`;
    const cachedResult = memCache.get(cacheKey);
    // istanbul ignore if
    if (cachedResult !== undefined) {
        return cachedResult;
    }
    const promisedRes = getReleaseNotesMdFileInner(repository, apiBaseUrl);
    memCache.set(cacheKey, promisedRes);
    return promisedRes;
}
exports.getReleaseNotesMdFile = getReleaseNotesMdFile;
async function getReleaseNotesMd(repository, version, baseUrl, apiBaseUrl) {
    logger_1.logger.trace(`getReleaseNotesMd(${repository}, ${version})`);
    const skippedRepos = ['facebook/react-native'];
    // istanbul ignore if
    if (skippedRepos.includes(repository)) {
        return null;
    }
    const changelog = await getReleaseNotesMdFile(repository, apiBaseUrl);
    if (!changelog) {
        return null;
    }
    const { changelogFile } = changelog;
    const changelogMd = changelog.changelogMd.replace(/\n\s*<a name="[^"]*">.*?<\/a>\n/g, '\n');
    for (const level of [1, 2, 3, 4, 5, 6, 7]) {
        const changelogParsed = sectionize(changelogMd, level);
        if (changelogParsed.length >= 2) {
            for (const section of changelogParsed) {
                try {
                    // replace brackets and parenthesis with space
                    const deParenthesizedSection = section.replace(/[[\]()]/g, ' ');
                    const [heading] = deParenthesizedSection.split('\n');
                    const title = heading
                        .replace(/^\s*#*\s*/, '')
                        .split(' ')
                        .filter(Boolean);
                    let body = section.replace(/.*?\n(-{3,}\n)?/, '').trim();
                    for (const word of title) {
                        if (word.includes(version) && !isUrl(word)) {
                            logger_1.logger.trace({ body }, 'Found release notes for v' + version);
                            // TODO: fix url
                            let url = `${baseUrl}${repository}/blob/master/${changelogFile}#`;
                            url += title.join('-').replace(/[^A-Za-z0-9-]/g, '');
                            body = massageBody(body, baseUrl);
                            if (body === null || body === void 0 ? void 0 : body.length) {
                                try {
                                    body = linkify_markdown_1.linkify(body, {
                                        repository: `${baseUrl}${repository}`,
                                    });
                                }
                                catch (err) /* istanbul ignore next */ {
                                    logger_1.logger.warn({ body, err }, 'linkify error');
                                }
                            }
                            return {
                                body,
                                url,
                            };
                        }
                    }
                }
                catch (err) /* istanbul ignore next */ {
                    logger_1.logger.warn({ err }, `Error parsing ${changelogFile}`);
                }
            }
        }
        logger_1.logger.trace({ repository }, `No level ${level} changelogs headings found`);
    }
    logger_1.logger.trace({ repository, version }, `No entry found in ${changelogFile}`);
    return null;
}
exports.getReleaseNotesMd = getReleaseNotesMd;
async function addReleaseNotes(input) {
    var _a, _b;
    if (!(input === null || input === void 0 ? void 0 : input.versions) ||
        (!((_a = input === null || input === void 0 ? void 0 : input.project) === null || _a === void 0 ? void 0 : _a.github) && !((_b = input === null || input === void 0 ? void 0 : input.project) === null || _b === void 0 ? void 0 : _b.gitlab))) {
        logger_1.logger.debug('Missing project or versions');
        return input;
    }
    const output = { ...input, versions: [] };
    const repository = input.project.github != null
        ? input.project.github.replace(/\.git$/, '')
        : input.project.gitlab;
    const cacheNamespace = input.project.github
        ? 'changelog-github-notes'
        : 'changelog-gitlab-notes';
    function getCacheKey(version) {
        return `${repository}:${version}`;
    }
    for (const v of input.versions) {
        let releaseNotes;
        const cacheKey = getCacheKey(v.version);
        releaseNotes = await packageCache.get(cacheNamespace, cacheKey);
        if (!releaseNotes) {
            if (input.project.github != null) {
                releaseNotes = await getReleaseNotesMd(repository, v.version, input.project.baseUrl, input.project.apiBaseUrl);
            }
            else {
                releaseNotes = await getReleaseNotesMd(repository, v.version, input.project.baseUrl, input.project.apiBaseUrl);
            }
            if (!releaseNotes) {
                releaseNotes = await getReleaseNotes(repository, v.version, input.project.depName, input.project.baseUrl, input.project.apiBaseUrl);
            }
            // Small hack to force display of release notes when there is a compare url
            if (!releaseNotes && v.compare.url) {
                releaseNotes = { url: v.compare.url };
            }
            const cacheMinutes = 55;
            await packageCache.set(cacheNamespace, cacheKey, releaseNotes, cacheMinutes);
        }
        output.versions.push({
            ...v,
            releaseNotes,
        });
        output.hasReleaseNotes = output.hasReleaseNotes || !!releaseNotes;
    }
    return output;
}
exports.addReleaseNotes = addReleaseNotes;
//# sourceMappingURL=release-notes.js.map