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
exports.getReleases = exports.getTerraformServiceDiscoveryResult = exports.registryStrategy = exports.defaultRegistryUrls = exports.id = void 0;
const logger_1 = require("../../logger");
const external_host_error_1 = require("../../types/errors/external-host-error");
const packageCache = __importStar(require("../../util/cache/package"));
const http_1 = require("../../util/http");
exports.id = 'terraform-module';
exports.defaultRegistryUrls = ['https://registry.terraform.io'];
exports.registryStrategy = 'first';
const http = new http_1.Http(exports.id);
function getRegistryRepository(lookupName, registryUrl) {
    let registry;
    const split = lookupName.split('/');
    if (split.length > 3 && split[0].includes('.')) {
        [registry] = split;
        split.shift();
    }
    else {
        registry = registryUrl;
    }
    if (!/^https?:\/\//.test(registry)) {
        registry = `https://${registry}`;
    }
    const repository = split.join('/');
    return {
        registry,
        repository,
    };
}
async function getTerraformServiceDiscoveryResult(registryUrl) {
    const discoveryURL = `${registryUrl}/.well-known/terraform.json`;
    const cacheNamespace = 'terraform-service-discovery';
    const cachedResult = await packageCache.get(cacheNamespace, registryUrl);
    // istanbul ignore if
    if (cachedResult) {
        return cachedResult;
    }
    const serviceDiscovery = (await http.getJson(discoveryURL)).body;
    const cacheMinutes = 1440; // 24h
    await packageCache.set(cacheNamespace, registryUrl, serviceDiscovery, cacheMinutes);
    return serviceDiscovery;
}
exports.getTerraformServiceDiscoveryResult = getTerraformServiceDiscoveryResult;
/**
 * terraform.getReleases
 *
 * This function will fetch a package from the specified Terraform registry and return all semver versions.
 *  - `sourceUrl` is supported of "source" field is set
 *  - `homepage` is set to the Terraform registry's page if it's on the official main registry
 */
async function getReleases({ lookupName, registryUrl, }) {
    const { registry, repository } = getRegistryRepository(lookupName, registryUrl);
    logger_1.logger.debug({ registry, terraformRepository: repository }, 'terraform.getDependencies()');
    const cacheNamespace = 'terraform-module';
    const cacheURL = `${registry}/${repository}`;
    const cachedResult = await packageCache.get(cacheNamespace, cacheURL);
    // istanbul ignore if
    if (cachedResult) {
        return cachedResult;
    }
    try {
        const serviceDiscovery = await getTerraformServiceDiscoveryResult(registryUrl);
        const pkgUrl = `${registry}${serviceDiscovery['modules.v1']}${repository}`;
        const res = (await http.getJson(pkgUrl)).body;
        const returnedName = res.namespace + '/' + res.name + '/' + res.provider;
        if (returnedName !== repository) {
            logger_1.logger.warn({ pkgUrl }, 'Terraform registry result mismatch');
            return null;
        }
        // Simplify response before caching and returning
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
        if (pkgUrl.startsWith('https://registry.terraform.io/')) {
            dep.homepage = `https://registry.terraform.io/modules/${repository}`;
        }
        logger_1.logger.trace({ dep }, 'dep');
        const cacheMinutes = 30;
        await packageCache.set(cacheNamespace, pkgUrl, dep, cacheMinutes);
        return dep;
    }
    catch (err) {
        const failureCodes = ['EAI_AGAIN'];
        // istanbul ignore if
        if (failureCodes.includes(err.code)) {
            throw new external_host_error_1.ExternalHostError(err);
        }
        throw err;
    }
}
exports.getReleases = getReleases;
//# sourceMappingURL=index.js.map