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
exports.extractPackageFile = exports.parseUrlPath = void 0;
const datasourceGithubTags = __importStar(require("../../datasource/github-tags"));
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const util_1 = require("./util");
function parseSha256(idx, content) {
    let i = idx;
    i += 'sha256'.length;
    i = util_1.skip(i, content, (c) => {
        return util_1.isSpace(c);
    });
    if (content[i] !== '"' && content[i] !== "'") {
        return null;
    }
    i += 1;
    const j = util_1.skip(i, content, (c) => {
        return c !== '"' && c !== "'";
    });
    const sha256 = content.slice(i, j);
    return sha256;
}
function extractSha256(content) {
    const sha256RegExp = /(^|\s)sha256(\s)/;
    let i = content.search(sha256RegExp);
    if (util_1.isSpace(content[i])) {
        i += 1;
    }
    return parseSha256(i, content);
}
function parseUrl(idx, content) {
    let i = idx;
    i += 'url'.length;
    i = util_1.skip(i, content, (c) => {
        return util_1.isSpace(c);
    });
    const chr = content[i];
    if (chr !== '"' && chr !== "'") {
        return null;
    }
    i += 1;
    const j = util_1.skip(i, content, (c) => {
        return c !== '"' && c !== "'" && !util_1.isSpace(c);
    });
    const url = content.slice(i, j);
    return url;
}
function extractUrl(content) {
    const urlRegExp = /(^|\s)url(\s)/;
    let i = content.search(urlRegExp);
    // content.search() returns -1 if not found
    if (i === -1) {
        return null;
    }
    /* istanbul ignore else */
    if (util_1.isSpace(content[i])) {
        i += 1;
    }
    return parseUrl(i, content);
}
function parseUrlPath(urlStr) {
    if (!urlStr) {
        return null;
    }
    try {
        const url = new URL(urlStr);
        if (url.hostname !== 'github.com') {
            return null;
        }
        let s = url.pathname.split('/');
        s = s.filter((val) => val);
        const ownerName = s[0];
        const repoName = s[1];
        let currentValue;
        if (s[2] === 'archive') {
            currentValue = s[3];
            const targz = currentValue.slice(currentValue.length - 7, currentValue.length);
            if (targz === '.tar.gz') {
                currentValue = currentValue.substring(0, currentValue.length - 7);
            }
        }
        else if (s[2] === 'releases' && s[3] === 'download') {
            currentValue = s[4];
        }
        if (!currentValue) {
            return null;
        }
        return { currentValue, ownerName, repoName };
    }
    catch (_) {
        return null;
    }
}
exports.parseUrlPath = parseUrlPath;
/* This function parses the "class className < Formula" header
   and returns the className and index of the character just after the header */
function parseClassHeader(idx, content) {
    let i = idx;
    i += 'class'.length;
    i = util_1.skip(i, content, (c) => {
        return util_1.isSpace(c);
    });
    // Skip all non space and non '<' characters
    let j = util_1.skip(i, content, (c) => {
        return !util_1.isSpace(c) && c !== '<';
    });
    const className = content.slice(i, j);
    i = j;
    // Skip spaces
    i = util_1.skip(i, content, (c) => {
        return util_1.isSpace(c);
    });
    if (content[i] === '<') {
        i += 1;
    }
    else {
        return null;
    } // Skip spaces
    i = util_1.skip(i, content, (c) => {
        return util_1.isSpace(c);
    });
    // Skip non-spaces
    j = util_1.skip(i, content, (c) => {
        return !util_1.isSpace(c);
    });
    if (content.slice(i, j) !== 'Formula') {
        return null;
    }
    return className;
}
function extractClassName(content) {
    const classRegExp = /(^|\s)class\s/;
    let i = content.search(classRegExp);
    if (util_1.isSpace(content[i])) {
        i += 1;
    }
    return parseClassHeader(i, content);
}
// TODO: Maybe check if quotes/double-quotes are balanced
function extractPackageFile(content) {
    logger_1.logger.trace('extractPackageFile()');
    /*
      1. match "class className < Formula"
      2. extract className
      3. extract url field (get depName from url)
      4. extract sha256 field
    */
    const cleanContent = util_1.removeComments(content);
    const className = extractClassName(cleanContent);
    if (!className) {
        logger_1.logger.debug('Invalid class definition');
        return null;
    }
    const url = extractUrl(cleanContent);
    if (!url) {
        logger_1.logger.debug('Invalid URL field');
    }
    const urlPathResult = parseUrlPath(url);
    let skipReason;
    let currentValue = null;
    let ownerName = null;
    let repoName = null;
    if (urlPathResult) {
        currentValue = urlPathResult.currentValue;
        ownerName = urlPathResult.ownerName;
        repoName = urlPathResult.repoName;
    }
    else {
        logger_1.logger.debug('Error: Unsupported URL field');
        skipReason = types_1.SkipReason.UnsupportedUrl;
    }
    const sha256 = extractSha256(cleanContent);
    if (!sha256 || sha256.length !== 64) {
        logger_1.logger.debug('Error: Invalid sha256 field');
        skipReason = types_1.SkipReason.InvalidSha256;
    }
    const dep = {
        depName: `${ownerName}/${repoName}`,
        managerData: { ownerName, repoName, sha256, url },
        currentValue,
        datasource: datasourceGithubTags.id,
    };
    if (skipReason) {
        dep.skipReason = skipReason;
        if (skipReason === 'unsupported-url') {
            dep.depName = className;
            dep.datasource = null;
        }
    }
    const deps = [dep];
    return { deps };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map