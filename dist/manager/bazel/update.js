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
exports.updateDependency = void 0;
const hasha_1 = require("hasha");
const logger_1 = require("../../logger");
const packageCache = __importStar(require("../../util/cache/package"));
const http_1 = require("../../util/http");
const regex_1 = require("../../util/regex");
const http = new http_1.Http('bazel');
function updateWithNewVersion(content, currentValue, newValue) {
    const currentVersion = currentValue.replace(/^v/, '');
    const newVersion = newValue.replace(/^v/, '');
    let newContent = content;
    do {
        newContent = newContent.replace(currentVersion, newVersion);
    } while (newContent.includes(currentVersion));
    return newContent;
}
function extractUrl(flattened) {
    const urlMatch = /url="(.*?)"/.exec(flattened);
    if (!urlMatch) {
        logger_1.logger.debug('Cannot locate urls in new definition');
        return null;
    }
    return [urlMatch[1]];
}
function extractUrls(content) {
    const flattened = content.replace(/\n/g, '').replace(/\s/g, '');
    const urlsMatch = /urls?=\[.*?\]/.exec(flattened);
    if (!urlsMatch) {
        return extractUrl(flattened);
    }
    const urls = urlsMatch[0]
        .replace(/urls?=\[/, '')
        .replace(/,?\]$/, '')
        .split(',')
        .map((url) => url.replace(/"/g, ''));
    return urls;
}
async function getHashFromUrl(url) {
    const cacheNamespace = 'url-sha256';
    const cachedResult = await packageCache.get(cacheNamespace, url);
    /* istanbul ignore next line */
    if (cachedResult) {
        return cachedResult;
    }
    try {
        const hash = await hasha_1.fromStream(http.stream(url), {
            algorithm: 'sha256',
        });
        const cacheMinutes = 3 * 24 * 60; // 3 days
        await packageCache.set(cacheNamespace, url, hash, cacheMinutes);
        return hash;
    }
    catch (err) /* istanbul ignore next */ {
        return null;
    }
}
async function getHashFromUrls(urls) {
    const hashes = (await Promise.all(urls.map((url) => getHashFromUrl(url)))).filter(Boolean);
    const distinctHashes = [...new Set(hashes)];
    if (!distinctHashes.length) {
        logger_1.logger.debug({ hashes, urls }, 'Could not calculate hash for URLs');
        return null;
    }
    // istanbul ignore if
    if (distinctHashes.length > 1) {
        logger_1.logger.warn({ urls }, 'Found multiple hashes for single def');
    }
    return distinctHashes[0];
}
function setNewHash(content, hash) {
    return content.replace(/(sha256\s*=\s*)"[^"]+"/, `$1"${hash}"`);
}
async function updateDependency({ fileContent, upgrade, }) {
    try {
        logger_1.logger.debug(`bazel.updateDependency(): ${upgrade.newValue || upgrade.newDigest}`);
        let newDef;
        if (upgrade.depType === 'container_pull') {
            newDef = upgrade.managerData.def
                .replace(/(tag\s*=\s*)"[^"]+"/, `$1"${upgrade.newValue}"`)
                .replace(/(digest\s*=\s*)"[^"]+"/, `$1"${upgrade.newDigest}"`);
        }
        if (upgrade.depType === 'git_repository' ||
            upgrade.depType === 'go_repository') {
            newDef = upgrade.managerData.def
                .replace(/(tag\s*=\s*)"[^"]+"/, `$1"${upgrade.newValue}"`)
                .replace(/(commit\s*=\s*)"[^"]+"/, `$1"${upgrade.newDigest}"`);
            if (upgrade.currentDigest && upgrade.updateType !== 'digest') {
                newDef = newDef.replace(/(commit\s*=\s*)"[^"]+".*?\n/, `$1"${upgrade.newDigest}",  # ${upgrade.newValue}\n`);
            }
        }
        else if ((upgrade.depType === 'http_archive' || upgrade.depType === 'http_file') &&
            upgrade.newValue) {
            newDef = updateWithNewVersion(upgrade.managerData.def, upgrade.currentValue, upgrade.newValue);
            const massages = {
                'bazel-skylib.': 'bazel_skylib-',
                '/bazel-gazelle/releases/download/0': '/bazel-gazelle/releases/download/v0',
                '/bazel-gazelle-0': '/bazel-gazelle-v0',
                '/rules_go/releases/download/0': '/rules_go/releases/download/v0',
                '/rules_go-0': '/rules_go-v0',
            };
            for (const [from, to] of Object.entries(massages)) {
                newDef = newDef.replace(from, to);
            }
            const urls = extractUrls(newDef);
            if (!(urls === null || urls === void 0 ? void 0 : urls.length)) {
                logger_1.logger.debug({ newDef }, 'urls is empty');
                return null;
            }
            const hash = await getHashFromUrls(urls);
            if (!hash) {
                return null;
            }
            logger_1.logger.debug({ hash }, 'Calculated hash');
            newDef = setNewHash(newDef, hash);
        }
        else if ((upgrade.depType === 'http_archive' || upgrade.depType === 'http_file') &&
            upgrade.newDigest) {
            const [, shortRepo] = upgrade.repo.split('/');
            const url = `https://github.com/${upgrade.repo}/archive/${upgrade.newDigest}.tar.gz`;
            const hash = await getHashFromUrl(url);
            newDef = setNewHash(upgrade.managerData.def, hash);
            newDef = newDef.replace(regex_1.regEx(`(strip_prefix\\s*=\\s*)"[^"]*"`), `$1"${shortRepo}-${upgrade.newDigest}"`);
            const match = upgrade.managerData.def.match(/(?<=archive\/).*(?=\.tar\.gz)/g) || [];
            match.forEach((matchedHash) => {
                newDef = newDef.replace(matchedHash, upgrade.newDigest);
            });
        }
        logger_1.logger.debug({ oldDef: upgrade.managerData.def, newDef });
        let existingRegExStr = `${upgrade.depType}\\([^\\)]+name\\s*=\\s*"${upgrade.depName}"(.*\\n)+?\\s*\\)`;
        if (newDef.endsWith('\n')) {
            existingRegExStr += '\n';
        }
        const existingDef = regex_1.regEx(existingRegExStr);
        // istanbul ignore if
        if (!existingDef.test(fileContent)) {
            logger_1.logger.debug('Cannot match existing string');
            return null;
        }
        return fileContent.replace(existingDef, newDef);
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.debug({ err }, 'Error setting new bazel WORKSPACE version');
        return null;
    }
}
exports.updateDependency = updateDependency;
//# sourceMappingURL=update.js.map