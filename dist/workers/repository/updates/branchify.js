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
exports.branchifyUpgrades = void 0;
const clean_git_ref_1 = require("clean-git-ref");
const slugify_1 = __importDefault(require("slugify"));
const logger_1 = require("../../../logger");
const template = __importStar(require("../../../util/template"));
const changelog_1 = require("../changelog");
const flatten_1 = require("./flatten");
const generate_1 = require("./generate");
/**
 * Clean git branch name
 *
 * Remove what clean-git-ref fails to:
 * - leading dot/leading dot after slash
 * - trailing dot
 * - whitespace
 */
function cleanBranchName(branchName) {
    return clean_git_ref_1.clean(branchName)
        .replace(/^\.|\.$/, '') // leading or trailing dot
        .replace(/\/\./g, '/') // leading dot after slash
        .replace(/\s/g, ''); // whitespace
}
async function branchifyUpgrades(config, packageFiles) {
    logger_1.logger.debug('branchifyUpgrades');
    const updates = await flatten_1.flattenUpdates(config, packageFiles);
    logger_1.logger.debug(`${updates.length} flattened updates found: ${updates
        .map((u) => u.depName)
        .filter((txt) => txt === null || txt === void 0 ? void 0 : txt.length)
        .join(', ')}`);
    const errors = [];
    const warnings = [];
    const branchUpgrades = {};
    const branches = [];
    for (const u of updates) {
        // extract parentDir and baseDir from packageFile
        if (u.packageFile) {
            const packagePath = u.packageFile.split('/');
            if (packagePath.length > 0) {
                packagePath.splice(-1, 1);
            }
            if (packagePath.length > 0) {
                u.parentDir = packagePath[packagePath.length - 1];
                u.baseDir = packagePath.join('/');
            }
            else {
                u.parentDir = '';
                u.baseDir = '';
            }
        }
        const update = { ...u };
        // Massage legacy vars just in case
        update.currentVersion = update.currentValue;
        update.newVersion = update.newVersion || update.newValue;
        const upper = (str) => str.charAt(0).toUpperCase() + str.substr(1);
        if (update.updateType) {
            update[`is${upper(update.updateType)}`] = true;
        }
        // Check whether to use a group name
        if (update.groupName) {
            logger_1.logger.debug('Using group branchName template');
            logger_1.logger.debug(`Dependency ${update.depName} is part of group ${update.groupName}`);
            update.groupSlug = slugify_1.default(update.groupSlug || update.groupName, {
                lower: true,
            });
            if (update.updateType === 'major' && update.separateMajorMinor) {
                if (update.separateMultipleMajor) {
                    update.groupSlug = `major-${update.newMajor}-${update.groupSlug}`;
                }
                else {
                    update.groupSlug = `major-${update.groupSlug}`;
                }
            }
            if (update.updateType === 'patch') {
                update.groupSlug = `patch-${update.groupSlug}`;
            }
            update.branchTopic = update.group.branchTopic || update.branchTopic;
            update.branchName = template.compile(update.group.branchName || update.branchName, update);
        }
        else {
            update.branchName = template.compile(update.branchName, update);
        }
        // Compile extra times in case of nested templates
        update.branchName = template.compile(update.branchName, update);
        update.branchName = cleanBranchName(template.compile(update.branchName, update));
        branchUpgrades[update.branchName] = branchUpgrades[update.branchName] || [];
        branchUpgrades[update.branchName] = [update].concat(branchUpgrades[update.branchName]);
    }
    logger_1.logger.debug(`Returning ${Object.keys(branchUpgrades).length} branch(es)`);
    await changelog_1.embedChangelogs(branchUpgrades);
    for (const branchName of Object.keys(branchUpgrades)) {
        // Add branch name to metadata before generating branch config
        logger_1.addMeta({
            branch: branchName,
        });
        const seenUpdates = {};
        // Filter out duplicates
        branchUpgrades[branchName] = branchUpgrades[branchName]
            .reverse()
            .filter((upgrade) => {
            const { manager, packageFile, depName, currentValue, newValue, } = upgrade;
            const upgradeKey = `${packageFile}:${depName}:${currentValue}`;
            const previousNewValue = seenUpdates[upgradeKey];
            if (previousNewValue && previousNewValue !== newValue) {
                logger_1.logger.info({
                    manager,
                    packageFile,
                    depName,
                    currentValue,
                    previousNewValue,
                    thisNewValue: newValue,
                }, 'Ignoring upgrade collision');
                return false;
            }
            seenUpdates[upgradeKey] = newValue;
            return true;
        })
            .reverse();
        const branch = generate_1.generateBranchConfig(branchUpgrades[branchName]);
        branch.branchName = branchName;
        branch.packageFiles = packageFiles;
        branches.push(branch);
    }
    logger_1.removeMeta(['branch']);
    logger_1.logger.debug(`config.repoIsOnboarded=${config.repoIsOnboarded}`);
    const branchList = config.repoIsOnboarded
        ? branches.map((upgrade) => upgrade.branchName)
        : config.branchList;
    // istanbul ignore next
    try {
        // Here we check if there are updates from the same source repo
        // that are not grouped into the same branch
        const branchUpdates = {};
        for (const branch of branches) {
            const { sourceUrl, branchName, depName, toVersion } = branch;
            if (sourceUrl && toVersion) {
                const key = `${sourceUrl}|${toVersion}`;
                branchUpdates[key] = branchUpdates[key] || {};
                if (!branchUpdates[key][branchName]) {
                    branchUpdates[key][branchName] = depName;
                }
            }
        }
        for (const [key, value] of Object.entries(branchUpdates)) {
            if (Object.keys(value).length > 1) {
                const [sourceUrl, toVersion] = key.split('|');
                logger_1.logger.debug({ sourceUrl, toVersion, branches: value }, 'Found sourceUrl with multiple branches that should probably be combined into a group');
            }
        }
    }
    catch (err) {
        logger_1.logger.debug({ err }, 'Error checking branch duplicates');
    }
    return {
        errors: config.errors.concat(errors),
        warnings: config.warnings.concat(warnings),
        branches,
        branchList,
    };
}
exports.branchifyUpgrades = branchifyUpgrades;
//# sourceMappingURL=branchify.js.map