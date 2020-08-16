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
exports.getReleases = exports.id = void 0;
const external_host_error_1 = require("../../types/errors/external-host-error");
const packageCache = __importStar(require("../../util/cache/package"));
const http_1 = require("../../util/http");
exports.id = 'crate';
const http = new http_1.Http(exports.id);
async function getReleases({ lookupName, }) {
    const cacheNamespace = 'datasource-crate';
    const cacheKey = lookupName;
    const cachedResult = await packageCache.get(cacheNamespace, cacheKey);
    // istanbul ignore if
    if (cachedResult) {
        return cachedResult;
    }
    const len = lookupName.length;
    let path;
    // Ignored because there is no way to test this without hitting up GitHub API
    /* istanbul ignore next */
    if (len === 1) {
        path = '1/' + lookupName;
    }
    else if (len === 2) {
        path = '2/' + lookupName;
    }
    else if (len === 3) {
        path = '3/' + lookupName[0] + '/' + lookupName;
    }
    else {
        path =
            lookupName.slice(0, 2) + '/' + lookupName.slice(2, 4) + '/' + lookupName;
    }
    const baseUrl = 'https://raw.githubusercontent.com/rust-lang/crates.io-index/master/';
    const crateUrl = baseUrl + path;
    try {
        const lines = (await http.get(crateUrl)).body
            .split('\n') // break into lines
            .map((line) => line.trim()) // remove whitespace
            .filter((line) => line.length !== 0) // remove empty lines
            .map((line) => JSON.parse(line)); // parse
        const result = {
            releases: [],
        };
        result.releases = lines
            .map((version) => {
            const release = {
                version: version.vers,
            };
            if (version.yanked) {
                release.isDeprecated = true;
            }
            return release;
        })
            .filter((release) => release.version);
        if (!result.releases.length) {
            return null;
        }
        const cacheMinutes = 10;
        await packageCache.set(cacheNamespace, cacheKey, result, cacheMinutes);
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