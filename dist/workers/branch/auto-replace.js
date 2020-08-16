"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doAutoReplace = exports.checkBranchDepsMatchBaseDeps = exports.confirmIfDepUpdated = void 0;
const error_messages_1 = require("../../constants/error-messages");
const logger_1 = require("../../logger");
const manager_1 = require("../../manager");
const fs_1 = require("../../util/fs");
const regex_1 = require("../../util/regex");
const string_1 = require("../../util/string");
const template_1 = require("../../util/template");
async function confirmIfDepUpdated(upgrade, newContent) {
    const { manager, packageFile, newValue, newDigest, depIndex, currentDigest, pinDigests, } = upgrade;
    const extractPackageFile = manager_1.get(manager, 'extractPackageFile');
    let newUpgrade;
    try {
        const newExtract = await extractPackageFile(newContent, packageFile, upgrade);
        newUpgrade = newExtract.deps[depIndex];
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.debug({ manager, packageFile }, 'Failed to parse newContent');
    }
    if (!newUpgrade) {
        logger_1.logger.debug({ manager, packageFile }, 'No newUpgrade');
        return false;
    }
    // istanbul ignore if
    if (upgrade.depName !== newUpgrade.depName) {
        logger_1.logger.debug({
            manager,
            packageFile,
            currentDepName: upgrade.depName,
            newDepName: newUpgrade.depName,
        }, 'depName mismatch');
    }
    if (newUpgrade.currentValue !== newValue) {
        logger_1.logger.debug({
            manager,
            packageFile,
            expectedValue: newValue,
            foundValue: newUpgrade.currentValue,
        }, 'Value mismatch');
        return false;
    }
    if (!newDigest) {
        return true;
    }
    if (newUpgrade.currentDigest === newDigest) {
        return true;
    }
    if (!currentDigest && !pinDigests) {
        return true;
    }
    // istanbul ignore next
    return false;
}
exports.confirmIfDepUpdated = confirmIfDepUpdated;
function getDepsSignature(deps) {
    return deps.map((dep) => `${dep.depName}${dep.lookupName}`).join(',');
}
async function checkBranchDepsMatchBaseDeps(upgrade, branchContent) {
    const { baseDeps, manager, packageFile } = upgrade;
    const extractPackageFile = manager_1.get(manager, 'extractPackageFile');
    try {
        const { deps: branchDeps } = await extractPackageFile(branchContent, packageFile, upgrade);
        return getDepsSignature(baseDeps) === getDepsSignature(branchDeps);
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.info({ manager, packageFile }, 'Failed to parse branchContent - rebasing');
        return false;
    }
}
exports.checkBranchDepsMatchBaseDeps = checkBranchDepsMatchBaseDeps;
async function doAutoReplace(upgrade, existingContent, reuseExistingBranch) {
    const { packageFile, depName, currentValue, newValue, currentDigest, newDigest, autoReplaceStringTemplate, } = upgrade;
    if (reuseExistingBranch) {
        if (!(await checkBranchDepsMatchBaseDeps(upgrade, existingContent))) {
            logger_1.logger.debug({ packageFile, depName }, 'Rebasing branch after deps list has changed');
            return null;
        }
        if (!(await confirmIfDepUpdated(upgrade, existingContent))) {
            logger_1.logger.debug({ packageFile, depName }, 'Rebasing after outdated branch dep found');
            return null;
        }
        logger_1.logger.debug({ packageFile, depName }, 'Branch dep is already updated');
        return existingContent;
    }
    const replaceString = upgrade.replaceString || currentValue;
    logger_1.logger.trace({ depName, replaceString }, 'autoReplace replaceString');
    let searchIndex = existingContent.indexOf(replaceString);
    if (searchIndex === -1) {
        logger_1.logger.warn({ packageFile, depName, existingContent, replaceString }, 'Cannot find replaceString in current file content');
        return existingContent;
    }
    try {
        let newString;
        if (autoReplaceStringTemplate) {
            newString = template_1.compile(autoReplaceStringTemplate, upgrade, false);
        }
        else {
            newString = replaceString;
            if (currentValue) {
                newString = newString.replace(regex_1.regEx(regex_1.escapeRegExp(currentValue), 'g'), newValue);
            }
            if (currentDigest && newDigest) {
                newString = newString.replace(regex_1.regEx(regex_1.escapeRegExp(currentDigest), 'g'), newDigest);
            }
        }
        logger_1.logger.debug({ packageFile, depName }, `Starting search at index ${searchIndex}`);
        // Iterate through the rest of the file
        for (; searchIndex < existingContent.length; searchIndex += 1) {
            // First check if we have a hit for the old version
            if (string_1.matchAt(existingContent, searchIndex, replaceString)) {
                logger_1.logger.debug({ packageFile, depName }, `Found match at index ${searchIndex}`);
                // Now test if the result matches
                const testContent = string_1.replaceAt(existingContent, searchIndex, replaceString, newString);
                await fs_1.writeLocalFile(upgrade.packageFile, testContent);
                if (await confirmIfDepUpdated(upgrade, testContent)) {
                    return testContent;
                }
                // istanbul ignore next
                await fs_1.writeLocalFile(upgrade.packageFile, existingContent);
            }
        }
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.debug({ packageFile, depName, err }, 'doAutoReplace error');
    }
    // istanbul ignore next
    throw new Error(error_messages_1.WORKER_FILE_UPDATE_FAILED);
}
exports.doAutoReplace = doAutoReplace;
//# sourceMappingURL=auto-replace.js.map