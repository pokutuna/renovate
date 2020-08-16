"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebaseOnboardingBranch = void 0;
const app_strings_1 = require("../../../../config/app-strings");
const logger_1 = require("../../../../logger");
const git_1 = require("../../../../util/git");
const config_1 = require("./config");
const defaultConfigFile = app_strings_1.configFileNames[0];
function getCommitMessage(config) {
    let commitMessage;
    // istanbul ignore if
    if (config.semanticCommits) {
        commitMessage = config.semanticCommitType;
        if (config.semanticCommitScope) {
            commitMessage += `(${config.semanticCommitScope})`;
        }
        commitMessage += ': ';
        commitMessage += 'add ' + defaultConfigFile;
    }
    else {
        commitMessage = 'Add ' + defaultConfigFile;
    }
    return commitMessage;
}
async function rebaseOnboardingBranch(config) {
    logger_1.logger.debug('Checking if onboarding branch needs rebasing');
    if (await git_1.isBranchModified(config.onboardingBranch)) {
        logger_1.logger.debug('Onboarding branch has been edited and cannot be rebased');
        return null;
    }
    const existingContents = await git_1.getFile(defaultConfigFile, config.onboardingBranch);
    const contents = config_1.getOnboardingConfig(config);
    if (contents === existingContents &&
        !(await git_1.isBranchStale(config.onboardingBranch))) {
        logger_1.logger.debug('Onboarding branch is up to date');
        return null;
    }
    logger_1.logger.debug('Rebasing onboarding branch');
    // istanbul ignore next
    const commitMessage = getCommitMessage(config);
    // istanbul ignore if
    if (config.dryRun) {
        logger_1.logger.info('DRY-RUN: Would rebase files in onboarding branch');
        return null;
    }
    return git_1.commitFiles({
        branchName: config.onboardingBranch,
        files: [
            {
                name: defaultConfigFile,
                contents,
            },
        ],
        message: commitMessage,
    });
}
exports.rebaseOnboardingBranch = rebaseOnboardingBranch;
//# sourceMappingURL=rebase.js.map