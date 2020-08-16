"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.raiseConfigWarningIssue = void 0;
const pull_requests_1 = require("../../constants/pull-requests");
const logger_1 = require("../../logger");
const platform_1 = require("../../platform");
async function raiseConfigWarningIssue(config, error) {
    logger_1.logger.debug('raiseConfigWarningIssue()');
    let body = `There is an error with this repository's Renovate configuration that needs to be fixed. As a precaution, Renovate will stop PRs until it is resolved.\n\n`;
    if (error.configFile) {
        body += `File: \`${error.configFile}\`\n`;
    }
    body += `Error type: ${error.validationError}\n`;
    if (error.validationMessage) {
        body += `Message: \`${error.validationMessage}\`\n`;
    }
    const pr = await platform_1.platform.getBranchPr(config.onboardingBranch);
    if ((pr === null || pr === void 0 ? void 0 : pr.state) === pull_requests_1.PR_STATE_OPEN) {
        logger_1.logger.debug('Updating onboarding PR with config error notice');
        body = `## Action Required: Fix Renovate Configuration\n\n${body}`;
        body += `\n\nOnce you have resolved this problem (in this onboarding branch), Renovate will return to providing you with a preview of your repository's configuration.`;
        if (config.dryRun) {
            logger_1.logger.info(`DRY-RUN: Would update PR #${pr.number}`);
        }
        else {
            await platform_1.platform.updatePr(pr.number, config.onboardingPrTitle, body);
        }
    }
    else if (config.dryRun) {
        logger_1.logger.info('DRY-RUN: Would ensure config error issue');
    }
    else {
        const once = false;
        const shouldReopen = config.configWarningReuseIssue;
        const res = await platform_1.platform.ensureIssue({
            title: `Action Required: Fix Renovate Configuration`,
            body,
            once,
            shouldReOpen: shouldReopen,
        });
        if (res === 'created') {
            logger_1.logger.warn({ configError: error, res }, 'Config Warning');
        }
    }
}
exports.raiseConfigWarningIssue = raiseConfigWarningIssue;
//# sourceMappingURL=error-config.js.map