"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkOnboardingBranch = void 0;
const error_messages_1 = require("../../../../constants/error-messages");
const logger_1 = require("../../../../logger");
const platform_1 = require("../../../../platform");
const extract_1 = require("../../extract");
const check_1 = require("./check");
const create_1 = require("./create");
const rebase_1 = require("./rebase");
async function checkOnboardingBranch(config) {
    logger_1.logger.debug('checkOnboarding()');
    logger_1.logger.trace({ config });
    const repoIsOnboarded = await check_1.isOnboarded(config);
    if (repoIsOnboarded) {
        logger_1.logger.debug('Repo is onboarded');
        return { ...config, repoIsOnboarded };
    }
    if (config.isFork && !config.includeForks) {
        throw new Error(error_messages_1.REPOSITORY_FORKED);
    }
    logger_1.logger.debug('Repo is not onboarded');
    if (await check_1.onboardingPrExists(config)) {
        logger_1.logger.debug('Onboarding PR already exists');
        const commit = await rebase_1.rebaseOnboardingBranch(config);
        if (commit) {
            logger_1.logger.info({ branch: config.onboardingBranch, commit, onboarding: true }, 'Branch updated');
        }
        // istanbul ignore if
        if (platform_1.platform.refreshPr) {
            const onboardingPr = await platform_1.platform.getBranchPr(config.onboardingBranch);
            await platform_1.platform.refreshPr(onboardingPr.number);
        }
    }
    else {
        logger_1.logger.debug('Onboarding PR does not exist');
        if (Object.entries(await extract_1.extractAllDependencies(config)).length === 0) {
            throw new Error(error_messages_1.MANAGER_NO_PACKAGE_FILES);
        }
        logger_1.logger.debug('Need to create onboarding PR');
        const commit = await create_1.createOnboardingBranch(config);
        // istanbul ignore if
        if (commit) {
            logger_1.logger.info({ branch: config.onboardingBranch, commit, onboarding: true }, 'Branch created');
        }
    }
    if (!config.dryRun) {
        await platform_1.platform.setBaseBranch(config.onboardingBranch);
    }
    const branchList = [config.onboardingBranch];
    return { ...config, repoIsOnboarded, branchList };
}
exports.checkOnboardingBranch = checkOnboardingBranch;
//# sourceMappingURL=index.js.map