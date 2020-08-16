"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pruneStaleBranches = void 0;
const error_messages_1 = require("../../../constants/error-messages");
const pull_requests_1 = require("../../../constants/pull-requests");
const logger_1 = require("../../../logger");
const platform_1 = require("../../../platform");
const git_1 = require("../../../util/git");
async function cleanUpBranches({ dryRun, pruneStaleBranches: enabled }, remainingBranches) {
    for (const branchName of remainingBranches) {
        try {
            const pr = await platform_1.platform.findPr({
                branchName,
                state: pull_requests_1.PR_STATE_OPEN,
            });
            const branchIsModified = await git_1.isBranchModified(branchName);
            if (pr && !branchIsModified) {
                if (!pr.title.endsWith('- autoclosed')) {
                    if (dryRun) {
                        logger_1.logger.info(`DRY-RUN: Would update pr ${pr.number} to ${pr.title} - autoclosed`);
                    }
                    else if (enabled === false) {
                        logger_1.logger.info(`PRUNING-DISABLED: Would update pr ${pr.number} to ${pr.title} - autoclosed`);
                    }
                    else {
                        await platform_1.platform.updatePr(pr.number, `${pr.title} - autoclosed`);
                    }
                }
            }
            const closePr = true;
            logger_1.logger.debug({ branch: branchName }, `Deleting orphan branch`);
            if (branchIsModified) {
                if (pr) {
                    logger_1.logger.debug({ prNo: pr === null || pr === void 0 ? void 0 : pr.number, prTitle: pr === null || pr === void 0 ? void 0 : pr.title }, 'Skip PR autoclosing');
                    if (dryRun) {
                        logger_1.logger.info(`DRY-RUN: Would add Autoclosing Skipped comment to PR`);
                    }
                    else {
                        await platform_1.platform.ensureComment({
                            number: pr.number,
                            topic: 'Autoclosing Skipped',
                            content: 'This PR has been flagged for autoclosing, however it is being skipped due to the branch being already modified. Please close/delete it manually or report a bug if you think this is in error.',
                        });
                    }
                }
            }
            else if (dryRun) {
                logger_1.logger.info(`DRY-RUN: Would deleting orphan branch ${branchName}`);
            }
            else if (enabled === false) {
                logger_1.logger.info(`PRUNING-DISABLED: Would deleting orphan branch ${branchName}`);
            }
            else {
                await platform_1.platform.deleteBranch(branchName, closePr);
            }
            if (pr && !branchIsModified) {
                logger_1.logger.info({ prNo: pr.number, prTitle: pr.title }, 'PR autoclosed');
            }
        }
        catch (err) /* istanbul ignore next */ {
            if (err.message !== error_messages_1.REPOSITORY_CHANGED) {
                logger_1.logger.warn({ err, branch: branchName }, 'Error pruning branch');
            }
        }
    }
}
async function pruneStaleBranches(config, branchList) {
    logger_1.logger.debug('Removing any stale branches');
    logger_1.logger.trace({ config }, `pruneStaleBranches`);
    logger_1.logger.debug(`config.repoIsOnboarded=${config.repoIsOnboarded}`);
    if (!branchList) {
        logger_1.logger.debug('No branchList');
        return;
    }
    let renovateBranches = await git_1.getAllRenovateBranches(config.branchPrefix);
    if (!(renovateBranches === null || renovateBranches === void 0 ? void 0 : renovateBranches.length)) {
        logger_1.logger.debug('No renovate branches found');
        return;
    }
    logger_1.logger.debug({ branchList, renovateBranches }, 'Branch lists');
    const lockFileBranch = `${config.branchPrefix}lock-file-maintenance`;
    renovateBranches = renovateBranches.filter((branch) => branch !== lockFileBranch);
    const remainingBranches = renovateBranches.filter((branch) => !branchList.includes(branch));
    logger_1.logger.debug(`remainingBranches=${remainingBranches}`);
    if (remainingBranches.length === 0) {
        logger_1.logger.debug('No branches to clean up');
        return;
    }
    await cleanUpBranches(config, remainingBranches);
}
exports.pruneStaleBranches = pruneStaleBranches;
//# sourceMappingURL=prune.js.map