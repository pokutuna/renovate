"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReleases = exports.registryStrategy = exports.defaultRegistryUrls = exports.id = void 0;
const logger_1 = require("../../logger");
const compare_1 = require("../../versioning/maven/compare");
const util_1 = require("../maven/util");
const sbt_package_1 = require("../sbt-package");
const util_2 = require("./util");
exports.id = 'sbt-plugin';
exports.defaultRegistryUrls = [util_2.SBT_PLUGINS_REPO];
exports.registryStrategy = 'hunt';
const ensureTrailingSlash = (str) => str.replace(/\/?$/, '/');
async function resolvePluginReleases(rootUrl, artifact, scalaVersion) {
    const searchRoot = `${rootUrl}/${artifact}`;
    const parse = (content) => util_2.parseIndexDir(content, (x) => !/^\.+$/.test(x));
    const indexContent = await util_1.downloadHttpProtocol(ensureTrailingSlash(searchRoot), 'sbt');
    if (indexContent) {
        const releases = [];
        const scalaVersionItems = parse(indexContent);
        const scalaVersions = scalaVersionItems.map((x) => x.replace(/^scala_/, ''));
        const searchVersions = !scalaVersions.includes(scalaVersion)
            ? scalaVersions
            : [scalaVersion];
        for (const searchVersion of searchVersions) {
            const searchSubRoot = `${searchRoot}/scala_${searchVersion}`;
            const subRootContent = await util_1.downloadHttpProtocol(ensureTrailingSlash(searchSubRoot), 'sbt');
            if (subRootContent) {
                const sbtVersionItems = parse(subRootContent);
                for (const sbtItem of sbtVersionItems) {
                    const releasesRoot = `${searchSubRoot}/${sbtItem}`;
                    const releasesIndexContent = await util_1.downloadHttpProtocol(ensureTrailingSlash(releasesRoot), 'sbt');
                    if (releasesIndexContent) {
                        const releasesParsed = parse(releasesIndexContent);
                        releasesParsed.forEach((x) => releases.push(x));
                    }
                }
            }
        }
        if (releases.length) {
            return [...new Set(releases)].sort(compare_1.compare);
        }
    }
    return null;
}
async function getReleases({ lookupName, registryUrl, }) {
    const [groupId, artifactId] = lookupName.split(':');
    const groupIdSplit = groupId.split('.');
    const artifactIdSplit = artifactId.split('_');
    const [artifact, scalaVersion] = artifactIdSplit;
    const repoRoot = ensureTrailingSlash(registryUrl);
    const searchRoots = [];
    // Optimize lookup order
    searchRoots.push(`${repoRoot}${groupIdSplit.join('.')}`);
    searchRoots.push(`${repoRoot}${groupIdSplit.join('/')}`);
    for (let idx = 0; idx < searchRoots.length; idx += 1) {
        const searchRoot = searchRoots[idx];
        let versions = await resolvePluginReleases(searchRoot, artifact, scalaVersion);
        let urls = {};
        if (!(versions === null || versions === void 0 ? void 0 : versions.length)) {
            const artifactSubdirs = await sbt_package_1.getArtifactSubdirs(searchRoot, artifact, scalaVersion);
            versions = await sbt_package_1.getPackageReleases(searchRoot, artifactSubdirs);
            const latestVersion = sbt_package_1.getLatestVersion(versions);
            urls = await sbt_package_1.getUrls(searchRoot, artifactSubdirs, latestVersion);
        }
        const dependencyUrl = `${searchRoot}/${artifact}`;
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