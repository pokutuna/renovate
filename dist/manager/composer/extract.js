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
const is_1 = __importDefault(require("@sindresorhus/is"));
const datasourceGitTags = __importStar(require("../../datasource/git-tags"));
const datasourcePackagist = __importStar(require("../../datasource/packagist"));
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const fs_1 = require("../../util/fs");
const composer_1 = require("../../versioning/composer");
/**
 * The regUrl is expected to be a base URL. GitLab composer repository installation guide specifies
 * to use a base URL containing packages.json. Composer still works in this scenario by determining
 * whether to add / remove packages.json from the URL.
 *
 * See https://github.com/composer/composer/blob/750a92b4b7aecda0e5b2f9b963f1cb1421900675/src/Composer/Repository/ComposerRepository.php#L815
 */
function transformRegUrl(url) {
    return url.replace(/(\/packages\.json)$/, '');
}
/**
 * Parse the repositories field from a composer.json
 *
 * Entries with type vcs or git will be added to repositories,
 * other entries will be added to registryUrls
 */
function parseRepositories(repoJson, repositories, registryUrls) {
    try {
        let packagist = true;
        Object.entries(repoJson).forEach(([key, repo]) => {
            if (is_1.default.object(repo)) {
                const name = is_1.default.array(repoJson) ? repo.name : key;
                // eslint-disable-next-line default-case
                switch (repo.type) {
                    case 'vcs':
                    case 'git':
                        // eslint-disable-next-line no-param-reassign
                        repositories[name] = repo;
                        break;
                    case 'composer':
                        registryUrls.push(transformRegUrl(repo.url));
                        break;
                    case 'package':
                        logger_1.logger.debug({ url: repo.url }, 'type package is not supported yet');
                }
                if (repo.packagist === false || repo['packagist.org'] === false) {
                    packagist = false;
                }
            }
            else if (['packagist', 'packagist.org'].includes(key) &&
                repo === false) {
                packagist = false;
            }
        });
        if (packagist) {
            registryUrls.push('https://packagist.org');
        }
        else {
            logger_1.logger.debug('Disabling packagist.org');
        }
    }
    catch (e) /* istanbul ignore next */ {
        logger_1.logger.debug({ repositories: repoJson }, 'Error parsing composer.json repositories config');
    }
}
async function extractPackageFile(content, fileName) {
    logger_1.logger.trace(`composer.extractPackageFile(${fileName})`);
    let composerJson;
    try {
        composerJson = JSON.parse(content);
    }
    catch (err) {
        logger_1.logger.debug({ fileName }, 'Invalid JSON');
        return null;
    }
    const repositories = {};
    const registryUrls = [];
    const res = { deps: [] };
    // handle lockfile
    const lockfilePath = fileName.replace(/\.json$/, '.lock');
    const lockContents = await fs_1.readLocalFile(lockfilePath, 'utf8');
    let lockParsed;
    if (lockContents) {
        logger_1.logger.debug({ packageFile: fileName }, 'Found composer lock file');
        try {
            lockParsed = JSON.parse(lockContents);
        }
        catch (err) /* istanbul ignore next */ {
            logger_1.logger.warn({ err }, 'Error processing composer.lock');
        }
    }
    // handle composer.json repositories
    if (composerJson.repositories) {
        parseRepositories(composerJson.repositories, repositories, registryUrls);
    }
    if (registryUrls.length !== 0) {
        res.registryUrls = registryUrls;
    }
    const deps = [];
    const depTypes = ['require', 'require-dev'];
    for (const depType of depTypes) {
        if (composerJson[depType]) {
            try {
                for (const [depName, version] of Object.entries(composerJson[depType])) {
                    const currentValue = version.trim();
                    // Default datasource and lookupName
                    let datasource = datasourcePackagist.id;
                    let lookupName = depName;
                    // Check custom repositories by type
                    if (repositories[depName]) {
                        // eslint-disable-next-line default-case
                        switch (repositories[depName].type) {
                            case 'vcs':
                            case 'git':
                                datasource = datasourceGitTags.id;
                                lookupName = repositories[depName].url;
                                break;
                        }
                    }
                    const dep = {
                        depType,
                        depName,
                        currentValue,
                        datasource,
                    };
                    if (depName !== lookupName) {
                        dep.lookupName = lookupName;
                    }
                    if (!depName.includes('/')) {
                        dep.skipReason = types_1.SkipReason.Unsupported;
                    }
                    if (currentValue === '*') {
                        dep.skipReason = types_1.SkipReason.AnyVersion;
                    }
                    if (lockParsed) {
                        const lockedDep = lockParsed.packages.find((item) => item.name === dep.depName);
                        if (lockedDep && composer_1.api.isVersion(lockedDep.version)) {
                            dep.lockedVersion = lockedDep.version.replace(/^v/i, '');
                        }
                    }
                    deps.push(dep);
                }
            }
            catch (err) /* istanbul ignore next */ {
                logger_1.logger.debug({ fileName, depType, err }, 'Error parsing composer.json');
                return null;
            }
        }
    }
    if (!deps.length) {
        return null;
    }
    res.deps = deps;
    if (composerJson.type) {
        res.managerData = { composerJsonType: composerJson.type };
    }
    return res;
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map