"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReleases = exports.registryStrategy = exports.defaultRegistryUrls = exports.id = void 0;
const external_host_error_1 = require("../../types/errors/external-host-error");
const http_1 = require("../../util/http");
const regex_1 = require("../../util/regex");
exports.id = 'gradle-version';
exports.defaultRegistryUrls = ['https://services.gradle.org/versions/all'];
exports.registryStrategy = 'merge';
const http = new http_1.Http(exports.id);
const buildTimeRegex = regex_1.regEx('^(\\d\\d\\d\\d)(\\d\\d)(\\d\\d)(\\d\\d)(\\d\\d)(\\d\\d)(\\+\\d\\d\\d\\d)$');
function formatBuildTime(timeStr) {
    if (!timeStr) {
        return null;
    }
    if (buildTimeRegex.test(timeStr)) {
        return timeStr.replace(buildTimeRegex, '$1-$2-$3T$4:$5:$6$7');
    }
    return null;
}
async function getReleases({ registryUrl, }) {
    let releases;
    try {
        const response = await http.getJson(registryUrl);
        releases = response.body
            .filter((release) => !release.snapshot && !release.nightly)
            .filter((release) => 
        // some milestone have wrong metadata and need to be filtered by version name content
        release.rcFor === '' && !release.version.includes('milestone'))
            .map((release) => ({
            version: release.version,
            releaseTimestamp: formatBuildTime(release.buildTime),
        }));
    }
    catch (err) /* istanbul ignore next */ {
        if (err.host === 'services.gradle.org') {
            throw new external_host_error_1.ExternalHostError(err);
        }
        throw err;
    }
    const res = {
        releases,
        homepage: 'https://gradle.org',
        sourceUrl: 'https://github.com/gradle/gradle',
    };
    if (res.releases.length) {
        return res;
    }
    // istanbul ignore next
    return null;
}
exports.getReleases = getReleases;
//# sourceMappingURL=index.js.map