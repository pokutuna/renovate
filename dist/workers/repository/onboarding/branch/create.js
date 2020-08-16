"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOnboardingBranch = void 0;
const app_strings_1 = require("../../../../config/app-strings");
const logger_1 = require("../../../../logger");
const git_1 = require("../../../../util/git");
const config_1 = require("./config");
const defaultConfigFile = app_strings_1.configFileNames[0];
function createOnboardingBranch(config) {
    logger_1.logger.debug('createOnboardingBranch()');
    const contents = config_1.getOnboardingConfig(config);
    logger_1.logger.debug('Creating onboarding branch');
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
    // istanbul ignore if
    if (config.dryRun) {
        logger_1.logger.info('DRY-RUN: Would commit files to onboarding branch');
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
exports.createOnboardingBranch = createOnboardingBranch;
//# sourceMappingURL=create.js.map