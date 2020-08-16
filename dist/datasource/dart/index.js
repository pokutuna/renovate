"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReleases = exports.id = void 0;
const external_host_error_1 = require("../../types/errors/external-host-error");
const http_1 = require("../../util/http");
exports.id = 'dart';
const http = new http_1.Http(exports.id);
async function getReleases({ lookupName, }) {
    let result = null;
    const pkgUrl = `https://pub.dartlang.org/api/packages/${lookupName}`;
    let raw = null;
    try {
        raw = await http.getJson(pkgUrl);
    }
    catch (err) {
        if (err.statusCode === 429 ||
            (err.statusCode >= 500 && err.statusCode < 600)) {
            throw new external_host_error_1.ExternalHostError(err);
        }
        throw err;
    }
    const body = raw === null || raw === void 0 ? void 0 : raw.body;
    if (body) {
        const { versions, latest } = body;
        if (versions && latest) {
            result = {
                releases: body.versions.map(({ version, published }) => ({
                    version,
                    releaseTimestamp: published,
                })),
            };
            const pubspec = latest.pubspec;
            if (pubspec) {
                if (pubspec.homepage) {
                    result.homepage = pubspec.homepage;
                }
                if (pubspec.repository) {
                    result.sourceUrl = pubspec.repository;
                }
            }
        }
    }
    return result;
}
exports.getReleases = getReleases;
//# sourceMappingURL=index.js.map