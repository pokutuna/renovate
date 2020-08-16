"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldReuseExistingBranch = void 0;
const logger_1 = require("../../logger");
const platform_1 = require("../../platform");
const git_1 = require("../../util/git");
async function shouldReuseExistingBranch(config) {
    const { branchName } = config;
    // Check if branch exists
    if (!(await git_1.branchExists(branchName))) {
        logger_1.logger.debug(`Branch needs creating`);
        return { reuseExistingBranch: false };
    }
    logger_1.logger.debug(`Branch already exists`);
    // Check for existing PR
    const pr = await platform_1.platform.getBranchPr(branchName);
    if (pr) {
        if (pr.title && pr.title.startsWith('rebase!')) {
            logger_1.logger.debug('Manual rebase requested via PR title for #' + pr.number);
            return { reuseExistingBranch: false };
        }
        if (pr.body && pr.body.includes(`- [x] <!-- rebase-check -->`)) {
            logger_1.logger.debug('Manual rebase requested via PR checkbox for #' + pr.number);
            return { reuseExistingBranch: false };
        }
        if (pr.labels && pr.labels.includes(config.rebaseLabel)) {
            logger_1.logger.debug('Manual rebase requested via PR labels for #' + pr.number);
            // istanbul ignore if
            if (config.dryRun) {
                logger_1.logger.info(`DRY-RUN: Would delete label ${config.rebaseLabel} from #${pr.number}`);
            }
            else {
                await platform_1.platform.deleteLabel(pr.number, config.rebaseLabel);
            }
            return { reuseExistingBranch: false };
        }
    }
    if (config.rebaseWhen === 'behind-base-branch' ||
        (config.rebaseWhen === 'auto' && (await platform_1.platform.getRepoForceRebase())) ||
        (config.automerge && config.automergeType === 'branch')) {
        if (await git_1.isBranchStale(branchName)) {
            logger_1.logger.debug(`Branch is stale and needs rebasing`);
            // We can rebase the branch only if no PR or PR can be rebased
            if (await git_1.isBranchModified(branchName)) {
                // TODO: Warn here so that it appears in PR body
                logger_1.logger.debug('Cannot rebase branch as it has been modified');
                return { reuseExistingBranch: true, isModified: true };
            }
            return { reuseExistingBranch: false };
        }
    }
    // Now check if PR is unmergeable. If so then we also rebase
    if (pr === null || pr === void 0 ? void 0 : pr.isConflicted) {
        logger_1.logger.debug('PR is conflicted');
        if ((await git_1.isBranchModified(branchName)) === false) {
            logger_1.logger.debug(`Branch is not mergeable and needs rebasing`);
            if (config.rebaseWhen === 'never') {
                logger_1.logger.debug('Rebasing disabled by config');
                return { reuseExistingBranch: true, isModified: false };
            }
            // Setting reuseExistingBranch back to undefined means that we'll use the default branch
            return { reuseExistingBranch: false };
        }
        // Don't do anything different, but warn
        // TODO: Add warning to PR
        logger_1.logger.debug(`Branch is not mergeable but can't be rebased`);
    }
    logger_1.logger.debug(`Branch does not need rebasing`);
    return { reuseExistingBranch: true, isModified: false };
}
exports.shouldReuseExistingBranch = shouldReuseExistingBranch;
//# sourceMappingURL=reuse.js.map