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
exports.extractPackageFile = void 0;
/* eslint no-plusplus: 0  */
const url_1 = require("url");
const github_url_from_git_1 = __importDefault(require("github-url-from-git"));
const datasourceDocker = __importStar(require("../../datasource/docker"));
const datasourceGithubReleases = __importStar(require("../../datasource/github-releases"));
const datasourceGo = __importStar(require("../../datasource/go"));
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const regex_1 = require("../../util/regex");
const dockerVersioning = __importStar(require("../../versioning/docker"));
function parseUrl(urlString) {
    // istanbul ignore if
    if (!urlString) {
        return null;
    }
    const url = url_1.parse(urlString);
    if (url.host !== 'github.com') {
        return null;
    }
    const path = url.path.split('/').slice(1);
    const repo = path[0] + '/' + path[1];
    let currentValue = null;
    if (path[2] === 'releases' && path[3] === 'download') {
        currentValue = path[4];
    }
    if (path[2] === 'archive') {
        currentValue = path[3].replace(/\.tar\.gz$/, '');
    }
    if (currentValue) {
        return { repo, currentValue };
    }
    // istanbul ignore next
    return null;
}
function findBalancedParenIndex(longString) {
    /**
     * Minimalistic string parser with single task -> find last char in def.
     * It treats [)] as the last char.
     * To find needed closing parenthesis we need to increment
     * nesting depth when parser feeds opening parenthesis
     * if one opening parenthesis -> 1
     * if two opening parenthesis -> 2
     * if two opening and one closing parenthesis -> 1
     * if ["""] finded then ignore all [)] until closing ["""] parsed.
     * https://github.com/renovatebot/renovate/pull/3459#issuecomment-478249702
     */
    let intShouldNotBeOdd = 0; // openClosePythonMultiLineComment
    let parenNestingDepth = 1;
    return [...longString].findIndex((char, i, arr) => {
        switch (char) {
            case '(':
                parenNestingDepth++;
                break;
            case ')':
                parenNestingDepth--;
                break;
            case '"':
                if (i > 1 && arr.slice(i - 2, i).every((prev) => char === prev)) {
                    intShouldNotBeOdd++;
                }
                break;
            default:
                break;
        }
        return !parenNestingDepth && !(intShouldNotBeOdd % 2) && char === ')';
    });
}
function parseContent(content) {
    return [
        'container_pull',
        'http_archive',
        'http_file',
        'go_repository',
        'git_repository',
    ].reduce((acc, prefix) => [
        ...acc,
        ...content
            .split(regex_1.regEx(prefix + '\\s*\\(', 'g'))
            .slice(1)
            .map((base) => {
            const ind = findBalancedParenIndex(base);
            return ind >= 0 && `${prefix}(${base.slice(0, ind)})`;
        })
            .filter(Boolean),
    ], []);
}
function extractPackageFile(content, fileName) {
    const definitions = parseContent(content);
    if (!definitions.length) {
        logger_1.logger.debug({ fileName }, 'No matching bazel WORKSPACE definitions found');
        return null;
    }
    logger_1.logger.debug({ definitions }, `Found ${definitions.length} definitions`);
    const deps = [];
    definitions.forEach((def) => {
        logger_1.logger.debug({ def }, 'Checking bazel definition');
        const [depType] = def.split('(', 1);
        const dep = { depType, managerData: { def } };
        let depName;
        let importpath;
        let remote;
        let currentValue;
        let commit;
        let url;
        let sha256;
        let digest;
        let repository;
        let registry;
        let match = /name\s*=\s*"([^"]+)"/.exec(def);
        if (match) {
            [, depName] = match;
        }
        match = /digest\s*=\s*"([^"]+)"/.exec(def);
        if (match) {
            [, digest] = match;
        }
        match = /registry\s*=\s*"([^"]+)"/.exec(def);
        if (match) {
            [, registry] = match;
        }
        match = /repository\s*=\s*"([^"]+)"/.exec(def);
        if (match) {
            [, repository] = match;
        }
        match = /remote\s*=\s*"([^"]+)"/.exec(def);
        if (match) {
            [, remote] = match;
        }
        match = /tag\s*=\s*"([^"]+)"/.exec(def);
        if (match) {
            [, currentValue] = match;
        }
        match = /url\s*=\s*"([^"]+)"/.exec(def);
        if (match) {
            [, url] = match;
        }
        match = /urls\s*=\s*\[\s*"([^\]]+)",?\s*\]/.exec(def);
        if (match) {
            const urls = match[1].replace(/\s/g, '').split('","');
            url = urls.find(parseUrl);
        }
        match = /commit\s*=\s*"([^"]+)"/.exec(def);
        if (match) {
            [, commit] = match;
        }
        match = /sha256\s*=\s*"([^"]+)"/.exec(def);
        if (match) {
            [, sha256] = match;
        }
        match = /importpath\s*=\s*"([^"]+)"/.exec(def);
        if (match) {
            [, importpath] = match;
        }
        logger_1.logger.debug({ dependency: depName, remote, currentValue });
        if (depType === 'git_repository' &&
            depName &&
            remote &&
            (currentValue || commit)) {
            dep.depName = depName;
            if (currentValue) {
                dep.currentValue = currentValue;
            }
            if (commit) {
                dep.currentDigest = commit;
            }
            // TODO: Check if we really need to use parse here or if it should always be a plain https url
            const githubURL = github_url_from_git_1.default(remote);
            if (githubURL) {
                const repo = githubURL.substring('https://github.com/'.length);
                dep.datasource = datasourceGithubReleases.id;
                dep.lookupName = repo;
                deps.push(dep);
            }
        }
        else if (depType === 'go_repository' &&
            depName &&
            importpath &&
            (currentValue || commit)) {
            dep.depName = depName;
            dep.currentValue = currentValue || commit.substr(0, 7);
            dep.datasource = datasourceGo.id;
            dep.lookupName = importpath;
            if (remote) {
                const remoteMatch = /https:\/\/github\.com(?:.*\/)(([a-zA-Z]+)([-])?([a-zA-Z]+))/.exec(remote);
                if (remoteMatch && remoteMatch[0].length === remote.length) {
                    dep.lookupName = remote.replace('https://', '');
                }
                else {
                    dep.skipReason = types_1.SkipReason.UnsupportedRemote;
                }
            }
            if (commit) {
                dep.currentValue = 'v0.0.0';
                dep.currentDigest = commit;
                dep.currentDigestShort = commit.substr(0, 7);
                dep.digestOneAndOnly = true;
            }
            deps.push(dep);
        }
        else if ((depType === 'http_archive' || depType === 'http_file') &&
            depName &&
            parseUrl(url) &&
            sha256) {
            const parsedUrl = parseUrl(url);
            dep.depName = depName;
            dep.repo = parsedUrl.repo;
            if (/^[a-f0-9]{40}$/i.test(parsedUrl.currentValue)) {
                dep.currentDigest = parsedUrl.currentValue;
            }
            else {
                dep.currentValue = parsedUrl.currentValue;
            }
            dep.datasource = datasourceGithubReleases.id;
            dep.lookupName = dep.repo;
            deps.push(dep);
        }
        else if (depType === 'container_pull' &&
            currentValue &&
            digest &&
            repository &&
            registry) {
            dep.currentDigest = digest;
            dep.currentValue = currentValue;
            dep.depName = depName;
            dep.versioning = dockerVersioning.id;
            dep.datasource = datasourceDocker.id;
            dep.lookupName = repository;
            dep.registryUrls = [registry];
            deps.push(dep);
        }
        else {
            logger_1.logger.debug({ def }, 'Failed to find dependency in bazel WORKSPACE definition');
        }
    });
    if (!deps.length) {
        return null;
    }
    return { deps };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map