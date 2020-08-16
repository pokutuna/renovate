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
const url_1 = require("url");
const error_messages_1 = require("../../constants/error-messages");
const logger_1 = require("../../logger");
const external_host_error_1 = require("../../types/errors/external-host-error");
const packageCache = __importStar(require("../../util/cache/package"));
const http_1 = require("../../util/http");
exports.id = 'repology';
const http = new http_1.Http(exports.id);
const cacheNamespace = `datasource-${exports.id}`;
const cacheMinutes = 60;
async function queryPackage(repoName, pkgName, pkgType) {
    try {
        const query = new url_1.URLSearchParams({
            repo: repoName,
            name_type: pkgType,
            target_page: 'api_v1_project',
            noautoresolve: 'on',
            name: pkgName,
        }).toString();
        // Retrieve list of packages by looking up Repology project
        const url = `https://repology.org/tools/project-by?${query}`;
        const res = await http.getJson(url);
        let pkgs = res.body.filter((pkg) => pkg.repo === repoName);
        // In some cases Repology bundles multiple packages into a single project,
        // which would result in ambiguous results. If we have more than one result
        // left, we should try to determine the correct package by comparing either
        // binname or srcname (depending on pkgType) to the given dependency name.
        if (pkgs.length > 1) {
            pkgs = pkgs.filter((pkg) => !pkg[pkgType] || pkg[pkgType] === pkgName);
        }
        // Abort if there is still more than one package left, as the result would
        // be ambiguous and unreliable. This should usually not happen...
        if (pkgs.length > 1) {
            logger_1.logger.warn({ repoName, pkgName, pkgType, pkgs }, 'Repology lookup returned ambiguous results, ignoring...');
            return null;
        }
        return pkgs[0];
    }
    catch (err) {
        if (err.statusCode === 404) {
            logger_1.logger.debug({ repoName, pkgName, pkgType }, 'Repository or package not found on Repology');
        }
        else if (err.statusCode === 403) {
            logger_1.logger.debug({ repoName }, 'Repology does not support tools/project-by lookups for repository');
        }
        else {
            throw err;
        }
    }
    return null;
}
async function getCachedPackage(repoName, pkgName) {
    // Fetch previous result from cache if available
    const cacheKey = `${repoName}/${pkgName}`;
    const cachedResult = await packageCache.get(cacheNamespace, cacheKey);
    // istanbul ignore if
    if (cachedResult) {
        return cachedResult;
    }
    // Attempt a binary package lookup and return if successfully
    const binPkg = await queryPackage(repoName, pkgName, 'binname');
    if (binPkg) {
        await packageCache.set(cacheNamespace, cacheKey, binPkg, cacheMinutes);
        return binPkg;
    }
    // Otherwise, attempt a source package lookup and return if successfully
    const srcPkg = await queryPackage(repoName, pkgName, 'srcname');
    if (srcPkg) {
        await packageCache.set(cacheNamespace, cacheKey, srcPkg, cacheMinutes);
        return srcPkg;
    }
    // No binary or source package was found on Repology
    return null;
}
async function getReleases({ lookupName, }) {
    var _a;
    // Ensure lookup name contains both repository and package
    const [repoName, pkgName] = lookupName.split('/', 2);
    if (!repoName || !pkgName) {
        throw new external_host_error_1.ExternalHostError(new Error('Repology lookup name must contain repository and package separated by slash (<repo>/<pkg>)'));
    }
    // Attempt to resolve package version through Repology
    logger_1.logger.trace(`repology.getReleases(${repoName}, ${pkgName})`);
    try {
        // Attempt to retrieve (cached) package information from Repology
        const pkg = await getCachedPackage(repoName, pkgName);
        if (!pkg) {
            return null;
        }
        // Always prefer origversion if available, otherwise default to version
        // This is required as source packages usually have no origversion
        const version = (_a = pkg.origversion) !== null && _a !== void 0 ? _a : pkg.version;
        return { releases: [{ version }] };
    }
    catch (err) {
        if (err.message === error_messages_1.HOST_DISABLED) {
            // istanbul ignore next
            logger_1.logger.trace({ lookupName, err }, 'Host disabled');
        }
        else {
            logger_1.logger.warn({ lookupName, err }, 'Repology lookup failed with unexpected error');
        }
        throw new external_host_error_1.ExternalHostError(err);
    }
}
exports.getReleases = getReleases;
//# sourceMappingURL=index.js.map