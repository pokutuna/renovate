"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReleases = exports.getUrls = exports.getLatestVersion = exports.getPackageReleases = exports.getArtifactSubdirs = exports.registryStrategy = exports.defaultRegistryUrls = exports.id = void 0;
const xmldoc_1 = require("xmldoc");
const logger_1 = require("../../logger");
const compare_1 = require("../../versioning/maven/compare");
const common_1 = require("../maven/common");
const util_1 = require("../maven/util");
const util_2 = require("../sbt-plugin/util");
exports.id = 'sbt-package';
exports.defaultRegistryUrls = [common_1.MAVEN_REPO];
exports.registryStrategy = 'hunt';
const ensureTrailingSlash = (str) => str.replace(/\/?$/, '/');
async function getArtifactSubdirs(searchRoot, artifact, scalaVersion) {
    const indexContent = await util_1.downloadHttpProtocol(ensureTrailingSlash(searchRoot), 'sbt');
    if (indexContent) {
        const parseSubdirs = (content) => util_2.parseIndexDir(content, (x) => {
            if (x === artifact) {
                return true;
            }
            if (x.startsWith(`${artifact}_native`)) {
                return false;
            }
            if (x.startsWith(`${artifact}_sjs`)) {
                return false;
            }
            return x.startsWith(`${artifact}_`);
        });
        let artifactSubdirs = parseSubdirs(indexContent);
        if (scalaVersion &&
            artifactSubdirs.includes(`${artifact}_${scalaVersion}`)) {
            artifactSubdirs = [`${artifact}_${scalaVersion}`];
        }
        return artifactSubdirs;
    }
    return null;
}
exports.getArtifactSubdirs = getArtifactSubdirs;
async function getPackageReleases(searchRoot, artifactSubdirs) {
    if (artifactSubdirs) {
        const releases = [];
        const parseReleases = (content) => util_2.parseIndexDir(content, (x) => !/^\.+$/.test(x));
        for (const searchSubdir of artifactSubdirs) {
            const content = await util_1.downloadHttpProtocol(ensureTrailingSlash(`${searchRoot}/${searchSubdir}`), 'sbt');
            if (content) {
                const subdirReleases = parseReleases(content);
                subdirReleases.forEach((x) => releases.push(x));
            }
        }
        if (releases.length) {
            return [...new Set(releases)].sort(compare_1.compare);
        }
    }
    return null;
}
exports.getPackageReleases = getPackageReleases;
function getLatestVersion(versions) {
    if (versions === null || versions === void 0 ? void 0 : versions.length) {
        return versions.reduce((latestVersion, version) => compare_1.compare(version, latestVersion) === 1 ? version : latestVersion);
    }
    return null;
}
exports.getLatestVersion = getLatestVersion;
async function getUrls(searchRoot, artifactDirs, version) {
    const result = {};
    if (!(artifactDirs === null || artifactDirs === void 0 ? void 0 : artifactDirs.length)) {
        return result;
    }
    if (!version) {
        return result;
    }
    for (const artifactDir of artifactDirs) {
        const [artifact] = artifactDir.split('_');
        const pomFileNames = [
            `${artifactDir}-${version}.pom`,
            `${artifact}-${version}.pom`,
        ];
        for (const pomFileName of pomFileNames) {
            const pomUrl = `${searchRoot}/${artifactDir}/${version}/${pomFileName}`;
            const content = await util_1.downloadHttpProtocol(pomUrl, 'sbt');
            if (content) {
                const pomXml = new xmldoc_1.XmlDocument(content);
                const homepage = pomXml.valueWithPath('url');
                if (homepage) {
                    result.homepage = homepage;
                }
                const sourceUrl = pomXml.valueWithPath('scm.url');
                if (sourceUrl) {
                    result.sourceUrl = sourceUrl
                        .replace(/^scm:/, '')
                        .replace(/^git:/, '')
                        .replace(/^git@github.com:/, 'https://github.com/')
                        .replace(/\.git$/, '');
                }
                return result;
            }
        }
    }
    return result;
}
exports.getUrls = getUrls;
async function getReleases({ lookupName, registryUrl, }) {
    const [groupId, artifactId] = lookupName.split(':');
    const groupIdSplit = groupId.split('.');
    const artifactIdSplit = artifactId.split('_');
    const [artifact, scalaVersion] = artifactIdSplit;
    const repoRoot = ensureTrailingSlash(registryUrl);
    const searchRoots = [];
    // Optimize lookup order
    searchRoots.push(`${repoRoot}${groupIdSplit.join('/')}`);
    searchRoots.push(`${repoRoot}${groupIdSplit.join('.')}`);
    for (let idx = 0; idx < searchRoots.length; idx += 1) {
        const searchRoot = searchRoots[idx];
        const artifactSubdirs = await getArtifactSubdirs(searchRoot, artifact, scalaVersion);
        const versions = await getPackageReleases(searchRoot, artifactSubdirs);
        const latestVersion = getLatestVersion(versions);
        const urls = await getUrls(searchRoot, artifactSubdirs, latestVersion);
        const dependencyUrl = searchRoot;
        if (versions) {
            return {
                ...urls,
                display: lookupName,
                group: groupId,
                name: artifactId,
                dependencyUrl,
                releases: versions.map((v) => ({ version: v })),
            };
        }
    }
    logger_1.logger.debug(`No versions found for ${lookupName} in ${searchRoots.length} repositories`);
    return null;
}
exports.getReleases = getReleases;
//# sourceMappingURL=index.js.map