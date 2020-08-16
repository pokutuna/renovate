"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRubygemsOrgDependency = exports.resetCache = void 0;
const logger_1 = require("../../logger");
const external_host_error_1 = require("../../types/errors/external-host-error");
const http_1 = require("../../util/http");
const common_1 = require("./common");
const http = new http_1.Http(common_1.id);
let lastSync = new Date('2000-01-01');
let packageReleases = Object.create(null); // Because we might need a "constructor" key
let contentLength = 0;
// Note: use only for tests
function resetCache() {
    lastSync = new Date('2000-01-01');
    packageReleases = Object.create(null);
    contentLength = 0;
}
exports.resetCache = resetCache;
/* https://bugs.chromium.org/p/v8/issues/detail?id=2869 */
const copystr = (x) => (' ' + x).slice(1);
async function updateRubyGemsVersions() {
    const url = 'https://rubygems.org/versions';
    const options = {
        headers: {
            'accept-encoding': 'identity',
            range: `bytes=${contentLength}-`,
        },
    };
    let newLines;
    try {
        logger_1.logger.debug('Rubygems: Fetching rubygems.org versions');
        const startTime = Date.now();
        newLines = (await http.get(url, options)).body;
        const durationMs = Math.round(Date.now() - startTime);
        logger_1.logger.debug({ durationMs }, 'Rubygems: Fetched rubygems.org versions');
    }
    catch (err) /* istanbul ignore next */ {
        if (err.statusCode !== 416) {
            contentLength = 0;
            packageReleases = Object.create(null); // Because we might need a "constructor" key
            throw new external_host_error_1.ExternalHostError(new Error('Rubygems fetch error - need to reset cache'));
        }
        logger_1.logger.debug('Rubygems: No update');
        lastSync = new Date();
        return;
    }
    function processLine(line) {
        let split;
        let pkg;
        let versions;
        try {
            const l = line.trim();
            if (!l.length || l.startsWith('created_at:') || l === '---') {
                return;
            }
            split = l.split(' ');
            [pkg, versions] = split;
            pkg = copystr(pkg);
            packageReleases[pkg] = packageReleases[pkg] || [];
            const lineVersions = versions.split(',').map((version) => version.trim());
            for (const lineVersion of lineVersions) {
                if (lineVersion.startsWith('-')) {
                    const deletedVersion = lineVersion.slice(1);
                    logger_1.logger.trace({ pkg, deletedVersion }, 'Rubygems: Deleting version');
                    packageReleases[pkg] = packageReleases[pkg].filter((version) => version !== deletedVersion);
                }
                else {
                    packageReleases[pkg].push(copystr(lineVersion));
                }
            }
        }
        catch (err) /* istanbul ignore next */ {
            logger_1.logger.warn({ err, line, split, pkg, versions }, 'Rubygems line parsing error');
        }
    }
    for (const line of newLines.split('\n')) {
        processLine(line);
    }
    lastSync = new Date();
}
function isDataStale() {
    const minutesElapsed = Math.floor((new Date().getTime() - lastSync.getTime()) / (60 * 1000));
    return minutesElapsed >= 5;
}
let _updateRubyGemsVersions;
async function syncVersions() {
    if (isDataStale()) {
        _updateRubyGemsVersions =
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            _updateRubyGemsVersions || updateRubyGemsVersions();
        await _updateRubyGemsVersions;
        _updateRubyGemsVersions = null;
    }
}
async function getRubygemsOrgDependency(lookupName) {
    logger_1.logger.debug(`getRubygemsOrgDependency(${lookupName})`);
    await syncVersions();
    if (!packageReleases[lookupName]) {
        return null;
    }
    const dep = {
        name: lookupName,
        releases: packageReleases[lookupName].map((version) => ({ version })),
    };
    return dep;
}
exports.getRubygemsOrgDependency = getRubygemsOrgDependency;
//# sourceMappingURL=get-rubygems-org.js.map