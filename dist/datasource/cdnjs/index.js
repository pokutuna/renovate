"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReleases = exports.id = void 0;
const external_host_error_1 = require("../../types/errors/external-host-error");
const http_1 = require("../../util/http");
const cache_1 = require("../cache");
exports.id = 'cdnjs';
const http = new http_1.Http(exports.id);
async function downloadLibrary(library) {
    const url = `https://api.cdnjs.com/libraries/${library}?fields=homepage,repository,assets`;
    return { data: (await http.getJson(url)).body };
}
async function getReleases({ lookupName, }) {
    // Each library contains multiple assets, so we cache at the library level instead of per-asset
    const library = lookupName.split('/')[0];
    try {
        const { assets, homepage, repository } = await cache_1.cacheAble({
            id: exports.id,
            lookup: library,
            cb: downloadLibrary,
        });
        if (!assets) {
            return null;
        }
        const assetName = lookupName.replace(`${library}/`, '');
        const releases = assets
            .filter(({ files }) => files.includes(assetName))
            .map(({ version, sri }) => ({ version, newDigest: sri[assetName] }));
        const result = { releases };
        if (homepage) {
            result.homepage = homepage;
        }
        if (repository === null || repository === void 0 ? void 0 : repository.url) {
            result.sourceUrl = repository.url;
        }
        return result;
    }
    catch (err) {
        if (err.statusCode !== 404) {
            throw new external_host_error_1.ExternalHostError(err);
        }
        throw err;
    }
}
exports.getReleases = getReleases;
//# sourceMappingURL=index.js.map