"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReleases = exports.id = void 0;
const logger_1 = require("../../logger");
const external_host_error_1 = require("../../types/errors/external-host-error");
const http_1 = require("../../util/http");
exports.id = 'hex';
const http = new http_1.Http(exports.id);
async function getReleases({ lookupName, }) {
    var _a;
    // Get dependency name from lookupName.
    // If the dependency is private lookupName contains organization name as following:
    // hexPackageName:organizationName
    // hexPackageName is used to pass it in hex dep url
    // organizationName is used for accessing to private deps
    const hexPackageName = lookupName.split(':')[0];
    const hexUrl = `https://hex.pm/api/packages/${hexPackageName}`;
    try {
        const response = await http.getJson(hexUrl);
        const hexRelease = response.body;
        if (!hexRelease) {
            logger_1.logger.warn({ datasource: 'hex', lookupName }, `Invalid response body`);
            return null;
        }
        const { releases = [], html_url: homepage, meta } = hexRelease;
        if (releases.length === 0) {
            logger_1.logger.debug(`No versions found for ${hexPackageName} (${hexUrl})`); // prettier-ignore
            return null;
        }
        const result = {
            releases: releases.map(({ version, inserted_at }) => inserted_at
                ? {
                    version,
                    releaseTimestamp: inserted_at,
                }
                : { version }),
        };
        if (homepage) {
            result.homepage = homepage;
        }
        if ((_a = meta === null || meta === void 0 ? void 0 : meta.links) === null || _a === void 0 ? void 0 : _a.Github) {
            result.sourceUrl = hexRelease.meta.links.Github;
        }
        return result;
    }
    catch (err) {
        if (err.statusCode === 429 ||
            (err.statusCode >= 500 && err.statusCode < 600)) {
            throw new external_host_error_1.ExternalHostError(err);
        }
        throw err;
    }
}
exports.getReleases = getReleases;
//# sourceMappingURL=index.js.map