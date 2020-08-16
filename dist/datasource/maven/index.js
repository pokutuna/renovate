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
exports.getReleases = exports.registryStrategy = exports.defaultRegistryUrls = void 0;
const url_1 = __importDefault(require("url"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const p_all_1 = __importDefault(require("p-all"));
const xmldoc_1 = require("xmldoc");
const logger_1 = require("../../logger");
const packageCache = __importStar(require("../../util/cache/package"));
const maven_1 = __importDefault(require("../../versioning/maven"));
const compare_1 = require("../../versioning/maven/compare");
const common_1 = require("./common");
const util_1 = require("./util");
var common_2 = require("./common");
Object.defineProperty(exports, "id", { enumerable: true, get: function () { return common_2.id; } });
exports.defaultRegistryUrls = [common_1.MAVEN_REPO];
exports.registryStrategy = 'merge';
function containsPlaceholder(str) {
    return /\${.*?}/g.test(str);
}
async function downloadFileProtocol(pkgUrl) {
    const pkgPath = pkgUrl.toString().replace('file://', '');
    if (!(await fs_extra_1.default.exists(pkgPath))) {
        return null;
    }
    return fs_extra_1.default.readFile(pkgPath, 'utf8');
}
function getMavenUrl(dependency, repoUrl, path) {
    return new url_1.default.URL(`${dependency.dependencyUrl}/${path}`, repoUrl);
}
async function downloadMavenXml(pkgUrl) {
    /* istanbul ignore if */
    if (!pkgUrl) {
        return null;
    }
    let rawContent;
    switch (pkgUrl.protocol) {
        case 'file:':
            rawContent = await downloadFileProtocol(pkgUrl);
            break;
        case 'http:':
        case 'https:':
            rawContent = await util_1.downloadHttpProtocol(pkgUrl);
            break;
        case 's3:':
            logger_1.logger.debug('Skipping s3 dependency');
            return null;
        default:
            logger_1.logger.warn(`Invalid protocol '${pkgUrl.protocol}' for Maven url: ${pkgUrl}`);
            return null;
    }
    if (!rawContent) {
        logger_1.logger.debug(`Content is not found for Maven url: ${pkgUrl}`);
        return null;
    }
    return new xmldoc_1.XmlDocument(rawContent);
}
async function getDependencyInfo(dependency, repoUrl, version) {
    const result = {};
    const path = `${version}/${dependency.name}-${version}.pom`;
    const pomUrl = getMavenUrl(dependency, repoUrl, path);
    const pomContent = await downloadMavenXml(pomUrl);
    if (!pomContent) {
        return result;
    }
    const homepage = pomContent.valueWithPath('url');
    if (homepage && !containsPlaceholder(homepage)) {
        result.homepage = homepage;
    }
    const sourceUrl = pomContent.valueWithPath('scm.url');
    if (sourceUrl && !containsPlaceholder(sourceUrl)) {
        result.sourceUrl = sourceUrl.replace(/^scm:/, '');
    }
    return result;
}
function getLatestStableVersion(versions) {
    const { isStable } = maven_1.default; // auto this bind
    const stableVersions = versions.filter(isStable);
    if (stableVersions.length) {
        return stableVersions.reduce((latestVersion, version) => compare_1.compare(version, latestVersion) === 1 ? version : latestVersion);
    }
    return null;
}
function getDependencyParts(lookupName) {
    const [group, name] = lookupName.split(':');
    const dependencyUrl = `${group.replace(/\./g, '/')}/${name}`;
    return {
        display: lookupName,
        group,
        name,
        dependencyUrl,
    };
}
function extractVersions(metadata) {
    const versions = metadata.descendantWithPath('versioning.versions');
    const elements = versions === null || versions === void 0 ? void 0 : versions.childrenNamed('version');
    if (!elements) {
        return [];
    }
    return elements.map((el) => el.val);
}
async function getVersionsFromMetadata(dependency, repoUrl) {
    const metadataUrl = getMavenUrl(dependency, repoUrl, 'maven-metadata.xml');
    const cacheNamespace = 'datasource-maven-metadata';
    const cacheKey = metadataUrl.toString();
    const cachedVersions = await packageCache.get(cacheNamespace, cacheKey);
    /* istanbul ignore if */
    if (cachedVersions) {
        return cachedVersions;
    }
    const mavenMetadata = await downloadMavenXml(metadataUrl);
    if (!mavenMetadata) {
        return null;
    }
    const versions = extractVersions(mavenMetadata);
    await packageCache.set(cacheNamespace, cacheKey, versions, 30);
    return versions;
}
// istanbul ignore next
function isValidArtifactsInfo(info, versions) {
    if (!info) {
        return false;
    }
    return versions.every((v) => info[v] !== undefined);
}
async function getArtifactInfo(version, artifactUrl) {
    const proto = artifactUrl.protocol;
    if (proto === 'http:' || proto === 'https:') {
        const result = await util_1.isHttpResourceExists(artifactUrl);
        return [version, result];
    }
    return [version, true];
}
async function filterMissingArtifacts(dependency, repoUrl, versions) {
    const cacheNamespace = 'datasource-maven-metadata';
    const cacheKey = dependency.dependencyUrl;
    let artifactsInfo = await packageCache.get(cacheNamespace, cacheKey);
    if (!isValidArtifactsInfo(artifactsInfo, versions)) {
        const queue = versions
            .map((version) => {
            const artifactUrl = getMavenUrl(dependency, repoUrl, `${version}/${dependency.name}-${version}.pom`);
            return [version, artifactUrl];
        })
            .filter(([_, artifactUrl]) => Boolean(artifactUrl))
            .map(([version, artifactUrl]) => () => getArtifactInfo(version, artifactUrl));
        const results = await p_all_1.default(queue, { concurrency: 5 });
        artifactsInfo = results.reduce((acc, [key, value]) => ({
            ...acc,
            [key]: value,
        }), {});
        // Retry earlier for status other than 404
        const cacheTTL = Object.values(artifactsInfo).some((x) => x === null)
            ? 60
            : 24 * 60;
        await packageCache.set(cacheNamespace, cacheKey, artifactsInfo, cacheTTL);
    }
    return versions.filter((v) => artifactsInfo[v]);
}
async function getReleases({ lookupName, registryUrl, }) {
    const dependency = getDependencyParts(lookupName);
    const versions = [];
    const repoForVersions = {};
    const repoUrl = registryUrl.replace(/\/?$/, '/');
    logger_1.logger.debug(`Looking up ${dependency.display} in repository ${repoUrl}`);
    const metadataVersions = await getVersionsFromMetadata(dependency, repoUrl);
    if (metadataVersions) {
        let availableVersions = metadataVersions;
        if (!process.env.RENOVATE_EXPERIMENTAL_NO_MAVEN_POM_CHECK) {
            availableVersions = await filterMissingArtifacts(dependency, repoUrl, metadataVersions);
        }
        const filteredVersions = availableVersions.filter((version) => !versions.includes(version));
        versions.push(...filteredVersions);
        const latestVersion = getLatestStableVersion(filteredVersions);
        if (latestVersion) {
            repoForVersions[latestVersion] = repoUrl;
        }
        logger_1.logger.debug(`Found ${availableVersions.length} new versions for ${dependency.display} in repository ${repoUrl}`); // prettier-ignore
    }
    if (!(versions === null || versions === void 0 ? void 0 : versions.length)) {
        return null;
    }
    let dependencyInfo = {};
    const latestVersion = getLatestStableVersion(versions);
    if (latestVersion) {
        dependencyInfo = await getDependencyInfo(dependency, repoForVersions[latestVersion], latestVersion);
    }
    return {
        ...dependency,
        ...dependencyInfo,
        releases: versions.map((v) => ({ version: v })),
    };
}
exports.getReleases = getReleases;
//# sourceMappingURL=index.js.map