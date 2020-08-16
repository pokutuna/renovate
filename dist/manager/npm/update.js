"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDependency = exports.bumpPackageVersion = void 0;
const fast_deep_equal_1 = __importDefault(require("fast-deep-equal"));
const semver_1 = require("semver");
const logger_1 = require("../../logger");
const string_1 = require("../../util/string");
function bumpPackageVersion(content, currentValue, bumpVersion) {
    if (!bumpVersion) {
        return content;
    }
    logger_1.logger.debug({ bumpVersion, currentValue }, 'Checking if we should bump package.json version');
    let newPjVersion;
    try {
        if (bumpVersion.startsWith('mirror:')) {
            const mirrorPackage = bumpVersion.replace('mirror:', '');
            const parsedContent = JSON.parse(content);
            newPjVersion =
                (parsedContent.dependencies || {})[mirrorPackage] ||
                    (parsedContent.devDependencies || {})[mirrorPackage] ||
                    (parsedContent.optionalDependencies || {})[mirrorPackage] ||
                    (parsedContent.peerDependencies || {})[mirrorPackage];
            if (!newPjVersion) {
                logger_1.logger.warn('bumpVersion mirror package not found: ' + mirrorPackage);
                return content;
            }
        }
        else {
            newPjVersion = semver_1.inc(currentValue, bumpVersion);
        }
        logger_1.logger.debug({ newPjVersion });
        const bumpedContent = content.replace(/("version":\s*")[^"]*/, `$1${newPjVersion}`);
        if (bumpedContent === content) {
            logger_1.logger.debug('Version was already bumped');
        }
        else {
            logger_1.logger.debug('Bumped package.json version');
        }
        return bumpedContent;
    }
    catch (err) {
        logger_1.logger.warn({
            content,
            currentValue,
            bumpVersion,
        }, 'Failed to bumpVersion');
        return content;
    }
}
exports.bumpPackageVersion = bumpPackageVersion;
function updateDependency({ fileContent, upgrade, }) {
    const { depType, managerData } = upgrade;
    const depName = (managerData === null || managerData === void 0 ? void 0 : managerData.key) || upgrade.depName;
    let { newValue } = upgrade;
    if (upgrade.currentRawValue) {
        if (upgrade.currentDigest) {
            logger_1.logger.debug('Updating package.json git digest');
            newValue = upgrade.currentRawValue.replace(upgrade.currentDigest, upgrade.newDigest.substring(0, upgrade.currentDigest.length));
        }
        else {
            logger_1.logger.debug('Updating package.json git version tag');
            newValue = upgrade.currentRawValue.replace(upgrade.currentValue, upgrade.newValue);
        }
    }
    if (upgrade.npmPackageAlias) {
        newValue = `npm:${upgrade.lookupName}@${newValue}`;
    }
    logger_1.logger.debug(`npm.updateDependency(): ${depType}.${depName} = ${newValue}`);
    try {
        const parsedContents = JSON.parse(fileContent);
        // Save the old version
        const oldVersion = parsedContents[depType][depName];
        if (oldVersion === newValue) {
            logger_1.logger.trace('Version is already updated');
            return bumpPackageVersion(fileContent, upgrade.packageJsonVersion, upgrade.bumpVersion);
        }
        // Update the file = this is what we want
        parsedContents[depType][depName] = newValue;
        // Look for the old version number
        const searchString = `"${oldVersion}"`;
        const newString = `"${newValue}"`;
        let newFileContent = null;
        // Skip ahead to depType section
        let searchIndex = fileContent.indexOf(`"${depType}"`) + depType.length;
        logger_1.logger.trace(`Starting search at index ${searchIndex}`);
        // Iterate through the rest of the file
        for (; searchIndex < fileContent.length; searchIndex += 1) {
            // First check if we have a hit for the old version
            if (string_1.matchAt(fileContent, searchIndex, searchString)) {
                logger_1.logger.trace(`Found match at index ${searchIndex}`);
                // Now test if the result matches
                const testContent = string_1.replaceAt(fileContent, searchIndex, searchString, newString);
                // Compare the parsed JSON structure of old and new
                if (fast_deep_equal_1.default(parsedContents, JSON.parse(testContent))) {
                    newFileContent = testContent;
                    break;
                }
            }
        }
        // istanbul ignore if
        if (!newFileContent) {
            logger_1.logger.debug({ fileContent, parsedContents, depType, depName, newValue }, 'Warning: updateDependency error');
            return fileContent;
        }
        if (parsedContents === null || parsedContents === void 0 ? void 0 : parsedContents.resolutions) {
            let depKey;
            if (parsedContents.resolutions[depName]) {
                depKey = depName;
            }
            else if (parsedContents.resolutions[`**/${depName}`]) {
                depKey = `**/${depName}`;
            }
            if (depKey) {
                // istanbul ignore if
                if (parsedContents.resolutions[depKey] !== oldVersion) {
                    logger_1.logger.debug({
                        depName,
                        depKey,
                        oldVersion,
                        resolutionsVersion: parsedContents.resolutions[depKey],
                    }, 'Upgraded dependency exists in yarn resolutions but is different version');
                }
                // Look for the old version number
                const oldResolution = `"${parsedContents.resolutions[depKey]}"`;
                const newResolution = `"${newValue}"`;
                // Update the file = this is what we want
                parsedContents.resolutions[depKey] = newValue;
                // Skip ahead to depType section
                searchIndex = newFileContent.indexOf(`"resolutions"`);
                logger_1.logger.trace(`Starting search at index ${searchIndex}`);
                // Iterate through the rest of the file
                for (; searchIndex < newFileContent.length; searchIndex += 1) {
                    // First check if we have a hit for the old version
                    if (string_1.matchAt(newFileContent, searchIndex, oldResolution)) {
                        logger_1.logger.trace(`Found match at index ${searchIndex}`);
                        // Now test if the result matches
                        const testContent = string_1.replaceAt(newFileContent, searchIndex, oldResolution, newResolution);
                        // Compare the parsed JSON structure of old and new
                        if (fast_deep_equal_1.default(parsedContents, JSON.parse(testContent))) {
                            newFileContent = testContent;
                            break;
                        }
                    }
                }
            }
        }
        return bumpPackageVersion(newFileContent, upgrade.packageJsonVersion, upgrade.bumpVersion);
    }
    catch (err) {
        logger_1.logger.debug({ err }, 'updateDependency error');
        return null;
    }
}
exports.updateDependency = updateDependency;
//# sourceMappingURL=update.js.map