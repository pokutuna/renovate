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
exports.filterVersions = void 0;
const semver = __importStar(require("semver"));
const error_messages_1 = require("../../../../constants/error-messages");
const logger_1 = require("../../../../logger");
const regex_1 = require("../../../../util/regex");
const allVersioning = __importStar(require("../../../../versioning"));
const npmVersioning = __importStar(require("../../../../versioning/npm"));
const pep440 = __importStar(require("../../../../versioning/pep440"));
const poetryVersioning = __importStar(require("../../../../versioning/poetry"));
const regexes = {};
function filterVersions(config, fromVersion, latestVersion, versions, releases) {
    const { versioning, ignoreUnstable, ignoreDeprecated, respectLatest, allowedVersions, } = config;
    const version = allVersioning.get(versioning);
    if (!fromVersion) {
        return [];
    }
    // Leave only versions greater than current
    let filteredVersions = versions.filter((v) => version.isGreaterThan(v, fromVersion));
    // Don't upgrade from non-deprecated to deprecated
    const fromRelease = releases.find((release) => release.version === fromVersion);
    if (ignoreDeprecated && fromRelease && !fromRelease.isDeprecated) {
        filteredVersions = filteredVersions.filter((v) => {
            const versionRelease = releases.find((release) => release.version === v);
            if (versionRelease.isDeprecated) {
                logger_1.logger.debug(`Skipping ${config.depName}@${v} because it is deprecated`);
                return false;
            }
            return true;
        });
    }
    if (allowedVersions) {
        if (allowedVersions.length > 1 &&
            allowedVersions.startsWith('/') &&
            allowedVersions.endsWith('/')) {
            regexes[allowedVersions] =
                regexes[allowedVersions] || regex_1.regEx(allowedVersions.slice(1, -1));
            filteredVersions = filteredVersions.filter((v) => regexes[allowedVersions].test(v));
        }
        else if (allowedVersions.length > 2 &&
            allowedVersions.startsWith('!/') &&
            allowedVersions.endsWith('/')) {
            regexes[allowedVersions] =
                regexes[allowedVersions] || regex_1.regEx(allowedVersions.slice(2, -1));
            filteredVersions = filteredVersions.filter((v) => !regexes[allowedVersions].test(v));
        }
        else if (version.isValid(allowedVersions)) {
            filteredVersions = filteredVersions.filter((v) => version.matches(v, allowedVersions));
        }
        else if (versioning !== npmVersioning.id &&
            semver.validRange(allowedVersions)) {
            logger_1.logger.debug({ depName: config.depName }, 'Falling back to npm semver syntax for allowedVersions');
            filteredVersions = filteredVersions.filter((v) => semver.satisfies(semver.coerce(v), allowedVersions));
        }
        else if (versioning === poetryVersioning.id &&
            pep440.isValid(allowedVersions)) {
            logger_1.logger.debug({ depName: config.depName }, 'Falling back to pypi syntax for allowedVersions');
            filteredVersions = filteredVersions.filter((v) => pep440.matches(v, allowedVersions));
        }
        else {
            const error = new Error(error_messages_1.CONFIG_VALIDATION);
            error.configFile = 'config';
            error.validationError = 'Invalid `allowedVersions`';
            error.validationMessage =
                'The following allowedVersions does not parse as a valid version or range: ' +
                    JSON.stringify(allowedVersions);
            throw error;
        }
    }
    // Return all versions if we aren't ignore unstable. Also ignore latest
    if (config.followTag || ignoreUnstable === false) {
        return filteredVersions;
    }
    // if current is unstable then allow unstable in the current major only
    if (!version.isStable(fromVersion)) {
        // Allow unstable only in current major
        return filteredVersions.filter((v) => version.isStable(v) ||
            (version.getMajor(v) === version.getMajor(fromVersion) &&
                version.getMinor(v) === version.getMinor(fromVersion) &&
                version.getPatch(v) === version.getPatch(fromVersion)));
    }
    // Normal case: remove all unstable
    filteredVersions = filteredVersions.filter((v) => version.isStable(v));
    // Filter the latest
    // No filtering if no latest
    // istanbul ignore if
    if (!latestVersion) {
        return filteredVersions;
    }
    // No filtering if not respecting latest
    if (respectLatest === false) {
        return filteredVersions;
    }
    // No filtering if fromVersion is already past latest
    if (version.isGreaterThan(fromVersion, latestVersion)) {
        return filteredVersions;
    }
    return filteredVersions.filter((v) => !version.isGreaterThan(v, latestVersion));
}
exports.filterVersions = filterVersions;
//# sourceMappingURL=filter.js.map