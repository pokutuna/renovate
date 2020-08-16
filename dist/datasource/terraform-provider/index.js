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
exports.getReleases = exports.registryStrategy = exports.defaultRegistryUrls = exports.id = void 0;
const url_1 = __importDefault(require("url"));
const logger_1 = require("../../logger");
const packageCache = __importStar(require("../../util/cache/package"));
const http_1 = require("../../util/http");
const terraform_module_1 = require("../terraform-module");
exports.id = 'terraform-provider';
exports.defaultRegistryUrls = [
    'https://registry.terraform.io',
    'https://releases.hashicorp.com',
];
exports.registryStrategy = 'hunt';
const http = new http_1.Http(exports.id);
async function queryRegistry(lookupName, registryURL, repository) {
    const serviceDiscovery = await terraform_module_1.getTerraformServiceDiscoveryResult(registryURL);
    const backendURL = `${registryURL}${serviceDiscovery['providers.v1']}${repository}`;
    const res = (await http.getJson(backendURL)).body;
    const dep = {
        name: repository,
        versions: {},
        releases: null,
    };
    if (res.source) {
        dep.sourceUrl = res.source;
    }
    dep.releases = res.versions.map((version) => ({
        version,
    }));
    dep.homepage = `${registryURL}/providers/${repository}`;
    logger_1.logger.trace({ dep }, 'dep');
    return dep;
}
// TODO: add long term cache
async function queryReleaseBackend(lookupName, registryURL, repository) {
    const backendLookUpName = `terraform-provider-${lookupName}`;
    const backendURL = registryURL + `/index.json`;
    const res = (await http.getJson(backendURL))
        .body;
    const dep = {
        name: repository,
        versions: {},
        releases: null,
        sourceUrl: `https://github.com/terraform-providers/${backendLookUpName}`,
    };
    dep.releases = Object.keys(res[backendLookUpName].versions).map((version) => ({
        version,
    }));
    logger_1.logger.trace({ dep }, 'dep');
    return dep;
}
/**
 * terraform-provider.getReleases
 *
 * This function will fetch a provider from the public Terraform registry and return all semver versions.
 */
async function getReleases({ lookupName, registryUrl, }) {
    const repository = lookupName.includes('/')
        ? lookupName
        : `hashicorp/${lookupName}`;
    const cacheNamespace = 'terraform-provider';
    const pkgUrl = `${registryUrl}/${repository}`;
    const cachedResult = await packageCache.get(cacheNamespace, pkgUrl);
    // istanbul ignore if
    if (cachedResult) {
        return cachedResult;
    }
    logger_1.logger.debug({ lookupName }, 'terraform-provider.getDependencies()');
    let dep = null;
    const registryHost = url_1.default.parse(registryUrl).host;
    if (registryHost === 'releases.hashicorp.com') {
        dep = await queryReleaseBackend(lookupName, registryUrl, repository);
    }
    else {
        dep = await queryRegistry(lookupName, registryUrl, repository);
    }
    const cacheMinutes = 30;
    await packageCache.set(cacheNamespace, pkgUrl, dep, cacheMinutes);
    return dep;
}
exports.getReleases = getReleases;
//# sourceMappingURL=index.js.map