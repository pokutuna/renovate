"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInRangeReleases = void 0;
const datasource_1 = require("../../../datasource");
const common_1 = require("../../../datasource/common");
const logger_1 = require("../../../logger");
const versioning_1 = require("../../../versioning");
function matchesMMP(version, v1, v2) {
    return (version.getMajor(v1) === version.getMajor(v2) &&
        version.getMinor(v1) === version.getMinor(v2) &&
        version.getPatch(v1) === version.getPatch(v2));
}
function matchesUnstable(version, v1, v2) {
    return !version.isStable(v1) && matchesMMP(version, v1, v2);
}
async function getInRangeReleases(config) {
    const { versioning, fromVersion, toVersion, depName, datasource } = config;
    // istanbul ignore if
    if (!common_1.isGetPkgReleasesConfig(config)) {
        return null;
    }
    try {
        const pkgReleases = (await datasource_1.getPkgReleases(config)).releases;
        const version = versioning_1.get(versioning);
        const releases = pkgReleases
            .filter((release) => version.isCompatible(release.version, fromVersion))
            .filter((release) => version.equals(release.version, fromVersion) ||
            version.isGreaterThan(release.version, fromVersion))
            .filter((release) => !version.isGreaterThan(release.version, toVersion))
            .filter((release) => version.isStable(release.version) ||
            matchesUnstable(version, fromVersion, release.version) ||
            matchesUnstable(version, toVersion, release.version));
        if (version.valueToVersion) {
            for (const release of releases || []) {
                release.version = version.valueToVersion(release.version);
            }
        }
        return releases;
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.debug({ err }, 'getInRangeReleases err');
        logger_1.logger.debug({ datasource, depName }, 'Error getting releases');
        return null;
    }
}
exports.getInRangeReleases = getInRangeReleases;
//# sourceMappingURL=releases.js.map