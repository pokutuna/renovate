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
exports.applyPackageRules = void 0;
const minimatch_1 = __importDefault(require("minimatch"));
const config_1 = require("../config");
const logger_1 = require("../logger");
const allVersioning = __importStar(require("../versioning"));
const regex_1 = require("./regex");
function matchesRule(inputConfig, packageRule) {
    const { versioning, packageFile, depType, depTypes, depName, currentValue, fromVersion, lockedVersion, updateType, isBump, sourceUrl, language, baseBranch, manager, datasource, } = inputConfig;
    let { paths, languages, baseBranchList, managers, datasources, depTypeList, packageNames, packagePatterns, excludePackageNames, excludePackagePatterns, matchCurrentVersion, sourceUrlPrefixes, updateTypes, } = packageRule;
    // Setting empty arrays simplifies our logic later
    paths = paths || [];
    languages = languages || [];
    baseBranchList = baseBranchList || [];
    managers = managers || [];
    datasources = datasources || [];
    depTypeList = depTypeList || [];
    packageNames = packageNames || [];
    packagePatterns = packagePatterns || [];
    excludePackageNames = excludePackageNames || [];
    excludePackagePatterns = excludePackagePatterns || [];
    sourceUrlPrefixes = sourceUrlPrefixes || [];
    matchCurrentVersion = matchCurrentVersion || null;
    updateTypes = updateTypes || [];
    let positiveMatch = false;
    // Massage a positive patterns patch if an exclude one is present
    if ((excludePackageNames.length || excludePackagePatterns.length) &&
        !(packageNames.length || packagePatterns.length)) {
        packagePatterns = ['.*'];
    }
    if (paths.length) {
        const isMatch = paths.some((rulePath) => packageFile.includes(rulePath) ||
            minimatch_1.default(packageFile, rulePath, { dot: true }));
        if (!isMatch) {
            return false;
        }
        positiveMatch = true;
    }
    if (depTypeList.length) {
        const isMatch = depTypeList.includes(depType) || (depTypes === null || depTypes === void 0 ? void 0 : depTypes.some((dt) => depTypeList.includes(dt)));
        if (!isMatch) {
            return false;
        }
        positiveMatch = true;
    }
    if (languages.length) {
        const isMatch = languages.includes(language);
        if (!isMatch) {
            return false;
        }
        positiveMatch = true;
    }
    if (baseBranchList.length) {
        const isMatch = baseBranchList.includes(baseBranch);
        if (!isMatch) {
            return false;
        }
        positiveMatch = true;
    }
    if (managers.length) {
        const isMatch = managers.includes(manager);
        if (!isMatch) {
            return false;
        }
        positiveMatch = true;
    }
    if (datasources.length) {
        const isMatch = datasources.includes(datasource);
        if (!isMatch) {
            return false;
        }
        positiveMatch = true;
    }
    if (updateTypes.length) {
        const isMatch = updateTypes.includes(updateType) ||
            (isBump && updateTypes.includes('bump'));
        if (!isMatch) {
            return false;
        }
        positiveMatch = true;
    }
    if (packageNames.length || packagePatterns.length) {
        let isMatch = packageNames.includes(depName);
        // name match is "or" so we check patterns if we didn't match names
        if (!isMatch) {
            for (const packagePattern of packagePatterns) {
                const packageRegex = regex_1.regEx(packagePattern === '^*$' || packagePattern === '*'
                    ? '.*'
                    : packagePattern);
                if (packageRegex.test(depName)) {
                    logger_1.logger.trace(`${depName} matches against ${packageRegex}`);
                    isMatch = true;
                }
            }
        }
        if (!isMatch) {
            return false;
        }
        positiveMatch = true;
    }
    if (excludePackageNames.length) {
        const isMatch = excludePackageNames.includes(depName);
        if (isMatch) {
            return false;
        }
        positiveMatch = true;
    }
    if (excludePackagePatterns.length) {
        let isMatch = false;
        for (const pattern of excludePackagePatterns) {
            const packageRegex = regex_1.regEx(pattern === '^*$' || pattern === '*' ? '.*' : pattern);
            if (packageRegex.test(depName)) {
                logger_1.logger.trace(`${depName} matches against ${packageRegex}`);
                isMatch = true;
            }
        }
        if (isMatch) {
            return false;
        }
        positiveMatch = true;
    }
    if (sourceUrlPrefixes.length) {
        const isMatch = sourceUrlPrefixes.some((prefix) => sourceUrl === null || sourceUrl === void 0 ? void 0 : sourceUrl.startsWith(prefix));
        if (!isMatch) {
            return false;
        }
        positiveMatch = true;
    }
    if (matchCurrentVersion) {
        const version = allVersioning.get(versioning);
        const matchCurrentVersionStr = matchCurrentVersion.toString();
        if (version.isVersion(matchCurrentVersionStr)) {
            let isMatch = false;
            try {
                isMatch = version.matches(matchCurrentVersionStr, currentValue);
            }
            catch (err) {
                // Do nothing
            }
            if (!isMatch) {
                return false;
            }
            positiveMatch = true;
        }
        else {
            const compareVersion = currentValue && version.isVersion(currentValue)
                ? currentValue // it's a version so we can match against it
                : lockedVersion || fromVersion; // need to match against this fromVersion, if available
            if (compareVersion) {
                // istanbul ignore next
                if (version.isVersion(compareVersion)) {
                    const isMatch = version.matches(compareVersion, matchCurrentVersion);
                    // istanbul ignore if
                    if (!isMatch) {
                        return false;
                    }
                    positiveMatch = true;
                }
                else {
                    return false;
                }
            }
            else {
                logger_1.logger.debug({ matchCurrentVersionStr, currentValue }, 'Could not find a version to compare');
                return false;
            }
        }
    }
    return positiveMatch;
}
function applyPackageRules(inputConfig) {
    let config = { ...inputConfig };
    const packageRules = config.packageRules || [];
    logger_1.logger.trace({ dependency: config.depName, packageRules }, `Checking against ${packageRules.length} packageRules`);
    packageRules.forEach((packageRule) => {
        // This rule is considered matched if there was at least one positive match and no negative matches
        if (matchesRule(config, packageRule)) {
            // Package rule config overrides any existing config
            config = config_1.mergeChildConfig(config, packageRule);
            delete config.packageNames;
            delete config.packagePatterns;
            delete config.excludePackageNames;
            delete config.excludePackagePatterns;
            delete config.depTypeList;
            delete config.matchCurrentVersion;
        }
    });
    return config;
}
exports.applyPackageRules = applyPackageRules;
//# sourceMappingURL=package-rules.js.map