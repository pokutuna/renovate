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
exports.extractPackageFile = void 0;
const path = __importStar(require("path"));
const find_up_1 = __importDefault(require("find-up"));
const xmldoc_1 = require("xmldoc");
const datasourceNuget = __importStar(require("../../datasource/nuget"));
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const clone_1 = require("../../util/clone");
const fs_1 = require("../../util/fs");
const versioning_1 = require("../../versioning");
const semverVersioning = __importStar(require("../../versioning/semver"));
async function readFileAsXmlDocument(file) {
    try {
        return new xmldoc_1.XmlDocument(await fs_1.readFile(file, 'utf8'));
    }
    catch (err) {
        logger_1.logger.debug({ err }, `failed to parse '${file}' as XML document`);
        return undefined;
    }
}
async function determineRegistryUrls(packageFile, localDir) {
    // Valid file names taken from https://github.com/NuGet/NuGet.Client/blob/f64621487c0b454eda4b98af853bf4a528bef72a/src/NuGet.Core/NuGet.Configuration/Settings/Settings.cs#L34
    const nuGetConfigFileNames = ['nuget.config', 'NuGet.config', 'NuGet.Config'];
    const nuGetConfigPath = await find_up_1.default(nuGetConfigFileNames, {
        cwd: path.dirname(path.join(localDir, packageFile)),
        type: 'file',
    });
    if ((nuGetConfigPath === null || nuGetConfigPath === void 0 ? void 0 : nuGetConfigPath.startsWith(localDir)) !== true) {
        return undefined;
    }
    logger_1.logger.debug({ nuGetConfigPath }, 'found NuGet.config');
    const nuGetConfig = await readFileAsXmlDocument(nuGetConfigPath);
    if (!nuGetConfig) {
        return undefined;
    }
    const packageSources = nuGetConfig.childNamed('packageSources');
    if (!packageSources) {
        return undefined;
    }
    const registryUrls = clone_1.clone(datasourceNuget.defaultRegistryUrls);
    for (const child of packageSources.children) {
        if (child.type === 'element') {
            if (child.name === 'clear') {
                logger_1.logger.debug(`clearing registry URLs`);
                registryUrls.length = 0;
            }
            else if (child.name === 'add') {
                const isHttpUrl = /^https?:\/\//i.test(child.attr.value);
                if (isHttpUrl) {
                    let registryUrl = child.attr.value;
                    if (child.attr.protocolVersion) {
                        registryUrl += `#protocolVersion=${child.attr.protocolVersion}`;
                    }
                    logger_1.logger.debug({ registryUrl }, 'adding registry URL');
                    registryUrls.push(registryUrl);
                }
                else {
                    logger_1.logger.debug({ registryUrl: child.attr.value }, 'ignoring local registry URL');
                }
            }
            // child.name === 'remove' not supported
        }
    }
    return registryUrls;
}
const packageRe = /<(?:PackageReference|DotNetCliToolReference|GlobalPackageReference).*(?:Include|Update)\s*=\s*"(?<depName>[^"]+)".*(?:Version|VersionOverride)\s*=\s*"(?:[[])?(?:(?<currentValue>[^"(,[\]]+)\s*(?:,\s*[)\]]|])?)"/;
async function extractPackageFile(content, packageFile, config) {
    logger_1.logger.trace({ packageFile }, 'nuget.extractPackageFile()');
    const { isVersion } = versioning_1.get(config.versioning || semverVersioning.id);
    const deps = [];
    const registryUrls = await determineRegistryUrls(packageFile, config.localDir);
    if (packageFile.endsWith('.config/dotnet-tools.json')) {
        let manifest;
        try {
            manifest = JSON.parse(content);
        }
        catch (err) {
            logger_1.logger.debug({ fileName: packageFile }, 'Invalid JSON');
            return null;
        }
        if (manifest.version !== 1) {
            logger_1.logger.debug({ contents: manifest }, 'Unsupported dotnet tools version');
            return null;
        }
        for (const depName of Object.keys(manifest.tools)) {
            const tool = manifest.tools[depName];
            const currentValue = tool.version;
            const dep = {
                depType: 'nuget',
                depName,
                currentValue,
                datasource: datasourceNuget.id,
            };
            if (registryUrls) {
                dep.registryUrls = registryUrls;
            }
            deps.push(dep);
        }
        return { deps };
    }
    for (const line of content.split('\n')) {
        /**
         * https://docs.microsoft.com/en-us/nuget/concepts/package-versioning
         * This article mentions that  Nuget 3.x and later tries to restore the lowest possible version
         * regarding to given version range.
         * 1.3.4 equals [1.3.4,)
         * Due to guarantee that an update of package version will result in its usage by the next restore + build operation,
         * only following constrained versions make sense
         * 1.3.4, [1.3.4], [1.3.4, ], [1.3.4, )
         * The update of the right boundary does not make sense regarding to the lowest version restore rule,
         * so we don't include it in the extracting regexp
         */
        const match = packageRe.exec(line);
        if (match) {
            const { currentValue, depName } = match.groups;
            const dep = {
                depType: 'nuget',
                depName,
                currentValue,
                datasource: datasourceNuget.id,
            };
            if (registryUrls) {
                dep.registryUrls = registryUrls;
            }
            if (!isVersion(currentValue)) {
                dep.skipReason = types_1.SkipReason.NotAVersion;
            }
            deps.push(dep);
        }
    }
    return { deps };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map