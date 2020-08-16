"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboardingPrExists = exports.isOnboarded = void 0;
const app_strings_1 = require("../../../../config/app-strings");
const error_messages_1 = require("../../../../constants/error-messages");
const pull_requests_1 = require("../../../../constants/pull-requests");
const logger_1 = require("../../../../logger");
const platform_1 = require("../../../../platform");
const fs_1 = require("../../../../util/fs");
const git_1 = require("../../../../util/git");
const findFile = async (fileName) => {
    logger_1.logger.debug(`findFile(${fileName})`);
    const fileList = await git_1.getFileList();
    return fileList.includes(fileName);
};
const configFileExists = async () => {
    for (const fileName of app_strings_1.configFileNames) {
        if (fileName !== 'package.json' && (await findFile(fileName))) {
            return true;
        }
    }
    return false;
};
const packageJsonConfigExists = async () => {
    try {
        const pJson = JSON.parse(await fs_1.readLocalFile('package.json', 'utf8'));
        if (pJson.renovate) {
            return true;
        }
    }
    catch (err) {
        // Do nothing
    }
    return false;
};
const closedPrExists = (config) => platform_1.platform.findPr({
    branchName: config.onboardingBranch,
    prTitle: config.onboardingPrTitle,
    state: pull_requests_1.PR_STATE_NOT_OPEN,
});
exports.isOnboarded = async (config) => {
    logger_1.logger.debug('isOnboarded()');
    const title = `Action required: Add a Renovate config`;
    // Repo is onboarded if admin is bypassing onboarding and does not require a
    // configuration file.
    if (config.requireConfig === false && config.onboarding === false) {
        // Return early and avoid checking for config files
        return true;
    }
    if (await configFileExists()) {
        logger_1.logger.debug('config file exists');
        await platform_1.platform.ensureIssueClosing(title);
        return true;
    }
    logger_1.logger.debug('config file not found');
    if (await packageJsonConfigExists()) {
        logger_1.logger.debug('package.json contains config');
        await platform_1.platform.ensureIssueClosing(title);
        return true;
    }
    // If onboarding has been disabled and config files are required then the
    // repository has not been onboarded yet
    if (config.requireConfig && config.onboarding === false) {
        throw new Error(error_messages_1.REPOSITORY_DISABLED);
    }
    const pr = await closedPrExists(config);
    if (!pr) {
        logger_1.logger.debug('Found no closed onboarding PR');
        return false;
    }
    logger_1.logger.debug('Found closed onboarding PR');
    if (!config.requireConfig) {
        logger_1.logger.debug('Config not mandatory so repo is considered onboarded');
        return true;
    }
    logger_1.logger.debug('Repo is not onboarded and no merged PRs exist');
    if (!config.suppressNotifications.includes('onboardingClose')) {
        // ensure PR comment
        await platform_1.platform.ensureComment({
            number: pr.number,
            topic: `Renovate is disabled`,
            content: `Renovate is disabled due to lack of config. If you wish to reenable it, you can either (a) commit a config file to your base branch, or (b) rename this closed PR to trigger a replacement onboarding PR.`,
        });
    }
    throw new Error(error_messages_1.REPOSITORY_DISABLED);
};
exports.onboardingPrExists = async (config) => (await platform_1.platform.getBranchPr(config.onboardingBranch)) != null;
//# sourceMappingURL=check.js.map