"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processBranch = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const luxon_1 = require("luxon");
const minimatch_1 = __importDefault(require("minimatch"));
const error_messages_1 = require("../../constants/error-messages");
const pull_requests_1 = require("../../constants/pull-requests");
const logger_1 = require("../../logger");
const post_update_1 = require("../../manager/npm/post-update");
const platform_1 = require("../../platform");
const types_1 = require("../../types");
const external_host_error_1 = require("../../types/errors/external-host-error");
const emoji_1 = require("../../util/emoji");
const exec_1 = require("../../util/exec");
const fs_1 = require("../../util/fs");
const git_1 = require("../../util/git");
const regex_1 = require("../../util/regex");
const common_1 = require("../common");
const pr_1 = require("../pr");
const automerge_1 = require("./automerge");
const check_existing_1 = require("./check-existing");
const commit_1 = require("./commit");
const get_updated_1 = require("./get-updated");
const reuse_1 = require("./reuse");
const schedule_1 = require("./schedule");
const status_checks_1 = require("./status-checks");
// TODO: proper typings
function rebaseCheck(config, branchPr) {
    const titleRebase = branchPr.title && branchPr.title.startsWith('rebase!');
    const labelRebase = branchPr.labels && branchPr.labels.includes(config.rebaseLabel);
    const prRebaseChecked = branchPr.body && branchPr.body.includes(`- [x] <!-- rebase-check -->`);
    return titleRebase || labelRebase || prRebaseChecked;
}
const rebasingRegex = /\*\*Rebasing\*\*: .*/;
async function processBranch(branchConfig, prLimitReached, commitLimitReached) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const config = { ...branchConfig };
    const dependencies = config.upgrades
        .map((upgrade) => upgrade.depName)
        .filter((v) => v) // remove nulls (happens for lock file maintenance)
        .filter((value, i, list) => list.indexOf(value) === i); // remove duplicates
    logger_1.logger.debug({ dependencies }, `processBranch with ${branchConfig.upgrades.length} upgrades`);
    logger_1.logger.trace({ config }, 'branch config');
    await platform_1.platform.setBaseBranch(config.baseBranch);
    const branchExists = await git_1.branchExists(config.branchName);
    const branchPr = await platform_1.platform.getBranchPr(config.branchName);
    logger_1.logger.debug(`branchExists=${branchExists}`);
    const dependencyDashboardCheck = (config.dependencyDashboardChecks || {})[config.branchName];
    // istanbul ignore if
    if (dependencyDashboardCheck) {
        logger_1.logger.debug('Branch has been checked in Dependency Dashboard: ' +
            dependencyDashboardCheck);
    }
    if (branchPr) {
        config.rebaseRequested = rebaseCheck(config, branchPr);
        logger_1.logger.debug(`Branch pr rebase requested: ${config.rebaseRequested}`);
    }
    try {
        logger_1.logger.debug(`Branch has ${dependencies.length} upgrade(s)`);
        // Check if branch already existed
        const existingPr = branchPr ? undefined : await check_existing_1.prAlreadyExisted(config);
        if (existingPr && !dependencyDashboardCheck) {
            logger_1.logger.debug({ prTitle: config.prTitle }, 'Closed PR already exists. Skipping branch.');
            if (existingPr.state === pull_requests_1.PR_STATE_CLOSED) {
                const topic = `Renovate Ignore Notification`;
                let content;
                if (config.updateType === 'major') {
                    content = `As this PR has been closed unmerged, Renovate will ignore this upgrade and you will not receive PRs for *any* future ${config.newMajor}.x releases. However, if you upgrade to ${config.newMajor}.x manually then Renovate will then reenable updates for minor and patch updates automatically.`;
                }
                else if (config.updateType === 'digest') {
                    content = `As this PR has been closed unmerged, Renovate will ignore this upgrade updateType and you will not receive PRs for *any* future ${config.depName}:${config.currentValue} digest updates. Digest updates will resume if you update the specified tag at any time.`;
                }
                else {
                    content = `As this PR has been closed unmerged, Renovate will now ignore this update (${config.newValue}). You will still receive a PR once a newer version is released, so if you wish to permanently ignore this dependency, please add it to the \`ignoreDeps\` array of your renovate config.`;
                }
                content +=
                    '\n\nIf this PR was closed by mistake or you changed your mind, you can simply rename this PR and you will soon get a fresh replacement PR opened.';
                if (!config.suppressNotifications.includes('prIgnoreNotification')) {
                    if (config.dryRun) {
                        logger_1.logger.info('DRY-RUN: Would ensure closed PR comment in PR #' +
                            existingPr.number);
                    }
                    else {
                        await platform_1.platform.ensureComment({
                            number: existingPr.number,
                            topic,
                            content,
                        });
                    }
                }
                if (branchExists) {
                    if (config.dryRun) {
                        logger_1.logger.info('DRY-RUN: Would delete branch ' + config.branchName);
                    }
                    else {
                        await platform_1.platform.deleteBranch(config.branchName);
                    }
                }
            }
            else if (existingPr.state === pull_requests_1.PR_STATE_MERGED) {
                logger_1.logger.debug({ pr: existingPr.number }, 'Merged PR is blocking this branch');
            }
            return 'already-existed';
        }
        // istanbul ignore if
        if (!branchExists && config.dependencyDashboardApproval) {
            if (dependencyDashboardCheck) {
                logger_1.logger.debug(`Branch ${config.branchName} is approved for creation`);
            }
            else {
                logger_1.logger.debug(`Branch ${config.branchName} needs approval`);
                return 'needs-approval';
            }
        }
        if (!branchExists &&
            prLimitReached &&
            !dependencyDashboardCheck &&
            !config.vulnerabilityAlert) {
            logger_1.logger.debug('Reached PR limit - skipping branch creation');
            return 'pr-limit-reached';
        }
        if (commitLimitReached &&
            !dependencyDashboardCheck &&
            !config.vulnerabilityAlert) {
            logger_1.logger.debug('Reached commits limit - skipping branch');
            return 'commit-limit-reached';
        }
        if (branchExists) {
            logger_1.logger.debug('Checking if PR has been edited');
            if (branchPr) {
                logger_1.logger.debug('Found existing branch PR');
                if (branchPr.state !== pull_requests_1.PR_STATE_OPEN) {
                    logger_1.logger.debug('PR has been closed or merged since this run started - aborting');
                    throw new Error(error_messages_1.REPOSITORY_CHANGED);
                }
                const branchIsModified = await git_1.isBranchModified(config.branchName);
                if (branchIsModified ||
                    (branchPr.targetBranch &&
                        branchPr.targetBranch !== branchConfig.baseBranch)) {
                    logger_1.logger.debug({ prNo: branchPr.number }, 'PR has been edited');
                    if (dependencyDashboardCheck || config.rebaseRequested) {
                        logger_1.logger.debug('Manual rebase has been requested for PR');
                    }
                    else {
                        const newBody = (_a = branchPr.body) === null || _a === void 0 ? void 0 : _a.replace(rebasingRegex, '**Rebasing**: Renovate will not automatically rebase this PR, because other commits have been found.');
                        if (newBody !== branchPr.body) {
                            logger_1.logger.debug('Updating existing PR to indicate that rebasing is not possible');
                            await platform_1.platform.updatePr(branchPr.number, branchPr.title, newBody);
                        }
                        return 'pr-edited';
                    }
                }
            }
        }
        // Check schedule
        config.isScheduledNow = schedule_1.isScheduledNow(config);
        if (!config.isScheduledNow && !dependencyDashboardCheck) {
            if (!branchExists) {
                logger_1.logger.debug('Skipping branch creation as not within schedule');
                return 'not-scheduled';
            }
            if (config.updateNotScheduled === false && !config.rebaseRequested) {
                logger_1.logger.debug('Skipping branch update as not within schedule');
                return 'not-scheduled';
            }
            // istanbul ignore if
            if (!branchPr) {
                logger_1.logger.debug('Skipping PR creation out of schedule');
                return 'not-scheduled';
            }
            logger_1.logger.debug('Branch + PR exists but is not scheduled -- will update if necessary');
        }
        if (config.updateType !== 'lockFileMaintenance' &&
            config.unpublishSafe &&
            config.canBeUnpublished &&
            (config.prCreation === 'not-pending' ||
                /* istanbul ignore next */ config.prCreation === 'status-success')) {
            logger_1.logger.debug('Skipping branch creation due to unpublishSafe + status checks');
            return 'pending';
        }
        if (config.upgrades.some((upgrade) => upgrade.stabilityDays && upgrade.releaseTimestamp)) {
            // Only set a stability status check if one or more of the updates contain
            // both a stabilityDays setting and a releaseTimestamp
            config.stabilityStatus = types_1.BranchStatus.green;
            // Default to 'success' but set 'pending' if any update is pending
            const oneDay = 24 * 60 * 60 * 1000;
            for (const upgrade of config.upgrades) {
                if (upgrade.stabilityDays && upgrade.releaseTimestamp) {
                    const daysElapsed = Math.floor((new Date().getTime() -
                        new Date(upgrade.releaseTimestamp).getTime()) /
                        oneDay);
                    if (!dependencyDashboardCheck &&
                        daysElapsed < upgrade.stabilityDays) {
                        logger_1.logger.debug({
                            depName: upgrade.depName,
                            daysElapsed,
                            stabilityDays: upgrade.stabilityDays,
                        }, 'Update has not passed stability days');
                        config.stabilityStatus = types_1.BranchStatus.yellow;
                    }
                }
            }
            // Don't create a branch if we know it will be status 'pending'
            if (!dependencyDashboardCheck &&
                !branchExists &&
                config.stabilityStatus === types_1.BranchStatus.yellow &&
                ['not-pending', 'status-success'].includes(config.prCreation)) {
                logger_1.logger.debug('Skipping branch creation due to stability days not met');
                return 'pending';
            }
        }
        // istanbul ignore if
        if (dependencyDashboardCheck === 'rebase' ||
            config.dependencyDashboardRebaseAllOpen) {
            logger_1.logger.debug('Manual rebase requested via Dependency Dashboard');
            config.reuseExistingBranch = false;
        }
        else {
            Object.assign(config, await reuse_1.shouldReuseExistingBranch(config));
        }
        logger_1.logger.debug(`Using reuseExistingBranch: ${config.reuseExistingBranch}`);
        const res = await get_updated_1.getUpdatedPackageFiles(config);
        // istanbul ignore if
        if (res.artifactErrors && config.artifactErrors) {
            res.artifactErrors = config.artifactErrors.concat(res.artifactErrors);
        }
        Object.assign(config, res);
        if ((_b = config.updatedPackageFiles) === null || _b === void 0 ? void 0 : _b.length) {
            logger_1.logger.debug(`Updated ${config.updatedPackageFiles.length} package files`);
        }
        else {
            logger_1.logger.debug('No package files need updating');
        }
        const additionalFiles = await post_update_1.getAdditionalFiles(config, branchConfig.packageFiles);
        config.artifactErrors = (config.artifactErrors || []).concat(additionalFiles.artifactErrors);
        config.updatedArtifacts = (config.updatedArtifacts || []).concat(additionalFiles.updatedArtifacts);
        if ((_c = config.updatedArtifacts) === null || _c === void 0 ? void 0 : _c.length) {
            logger_1.logger.debug({
                updatedArtifacts: config.updatedArtifacts.map((f) => f.name === '|delete|' ? `${f.contents} (delete)` : f.name),
            }, `Updated ${config.updatedArtifacts.length} lock files`);
        }
        else {
            logger_1.logger.debug('No updated lock files in branch');
        }
        if (
        /* Only run post-upgrade tasks if there are changes to package files... */
        (((_d = config.updatedPackageFiles) === null || _d === void 0 ? void 0 : _d.length) > 0 ||
            /* ... or changes to artifacts */
            ((_e = config.updatedArtifacts) === null || _e === void 0 ? void 0 : _e.length) > 0) &&
            global.trustLevel === 'high' &&
            is_1.default.nonEmptyArray(config.allowedPostUpgradeCommands)) {
            logger_1.logger.debug({
                tasks: config.postUpgradeTasks,
                allowedCommands: config.allowedPostUpgradeCommands,
            }, 'Checking for post-upgrade tasks');
            const commands = config.postUpgradeTasks.commands || [];
            const fileFilters = config.postUpgradeTasks.fileFilters || [];
            if (is_1.default.nonEmptyArray(commands)) {
                // Persist updated files in file system so any executed commands can see them
                for (const file of config.updatedPackageFiles.concat(config.updatedArtifacts)) {
                    if (file.name !== '|delete|') {
                        let contents;
                        if (typeof file.contents === 'string') {
                            contents = Buffer.from(file.contents);
                        }
                        else {
                            contents = file.contents;
                        }
                        await fs_1.writeLocalFile(file.name, contents);
                    }
                }
                for (const cmd of commands) {
                    if (!config.allowedPostUpgradeCommands.some((pattern) => regex_1.regEx(pattern).test(cmd))) {
                        logger_1.logger.warn({
                            cmd,
                            allowedPostUpgradeCommands: config.allowedPostUpgradeCommands,
                        }, 'Post-upgrade task did not match any on allowed list');
                    }
                    else {
                        logger_1.logger.debug({ cmd }, 'Executing post-upgrade task');
                        const execResult = await exec_1.exec(cmd, {
                            cwd: config.localDir,
                        });
                        logger_1.logger.debug({ cmd, ...execResult }, 'Executed post-upgrade task');
                    }
                }
                const status = await git_1.getRepoStatus();
                for (const relativePath of status.modified.concat(status.not_added)) {
                    for (const pattern of fileFilters) {
                        if (minimatch_1.default(relativePath, pattern)) {
                            logger_1.logger.debug({ file: relativePath, pattern }, 'Post-upgrade file saved');
                            const existingContent = await fs_1.readLocalFile(relativePath);
                            config.updatedArtifacts.push({
                                name: relativePath,
                                contents: existingContent,
                            });
                        }
                    }
                }
                for (const relativePath of status.deleted || []) {
                    for (const pattern of fileFilters) {
                        if (minimatch_1.default(relativePath, pattern)) {
                            logger_1.logger.debug({ file: relativePath, pattern }, 'Post-upgrade file removed');
                            config.updatedArtifacts.push({
                                name: '|delete|',
                                contents: relativePath,
                            });
                        }
                    }
                }
            }
        }
        if ((_f = config.artifactErrors) === null || _f === void 0 ? void 0 : _f.length) {
            if (config.releaseTimestamp) {
                logger_1.logger.debug(`Branch timestamp: ` + config.releaseTimestamp);
                const releaseTimestamp = luxon_1.DateTime.fromISO(config.releaseTimestamp);
                if (releaseTimestamp.plus({ days: 1 }) < luxon_1.DateTime.local()) {
                    logger_1.logger.debug('PR is older than a day, raise PR with lock file errors');
                }
                else if (branchExists) {
                    logger_1.logger.debug('PR is less than a day old but branchExists so updating anyway');
                }
                else {
                    logger_1.logger.debug('PR is less than a day old - raise error instead of PR');
                    throw new Error(error_messages_1.MANAGER_LOCKFILE_ERROR);
                }
            }
            else {
                logger_1.logger.debug('PR has no releaseTimestamp');
            }
        }
        config.forceCommit =
            !!dependencyDashboardCheck ||
                config.rebaseRequested || (branchPr === null || branchPr === void 0 ? void 0 : branchPr.isConflicted);
        const commitHash = await commit_1.commitFilesToBranch(config);
        // istanbul ignore if
        if (branchPr && platform_1.platform.refreshPr) {
            await platform_1.platform.refreshPr(branchPr.number);
        }
        if (!commitHash && !branchExists) {
            return 'no-work';
        }
        if (commitHash) {
            const action = branchExists ? 'updated' : 'created';
            logger_1.logger.info({ commitHash }, `Branch ${action}`);
        }
        // Set branch statuses
        await status_checks_1.setStability(config);
        await status_checks_1.setUnpublishable(config);
        // break if we pushed a new commit because status check are pretty sure pending but maybe not reported yet
        if (!dependencyDashboardCheck &&
            !config.rebaseRequested &&
            commitHash &&
            (((_g = config.requiredStatusChecks) === null || _g === void 0 ? void 0 : _g.length) || config.prCreation !== 'immediate')) {
            logger_1.logger.debug({ commitHash }, `Branch status pending`);
            return 'pending';
        }
        // Try to automerge branch and finish if successful, but only if branch already existed before this run
        if (branchExists || !config.requiredStatusChecks) {
            const mergeStatus = await automerge_1.tryBranchAutomerge(config);
            logger_1.logger.debug(`mergeStatus=${mergeStatus}`);
            if (mergeStatus === 'automerged') {
                logger_1.logger.debug('Branch is automerged - returning');
                return 'automerged';
            }
            if (mergeStatus === 'automerge aborted - PR exists' ||
                mergeStatus === 'branch status error' ||
                mergeStatus === 'failed') {
                logger_1.logger.debug({ mergeStatus }, 'Branch automerge not possible');
                config.forcePr = true;
                config.branchAutomergeFailureMessage = mergeStatus;
            }
        }
    }
    catch (err) /* istanbul ignore next */ {
        if (err.statusCode === 404) {
            throw new Error(error_messages_1.REPOSITORY_CHANGED);
        }
        if (err.message === error_messages_1.PLATFORM_RATE_LIMIT_EXCEEDED) {
            logger_1.logger.debug('Passing rate-limit-exceeded error up');
            throw err;
        }
        if (err.message === error_messages_1.REPOSITORY_CHANGED) {
            logger_1.logger.debug('Passing repository-changed error up');
            throw err;
        }
        if (err.message &&
            err.message.startsWith('remote: Invalid username or password')) {
            logger_1.logger.debug('Throwing bad credentials');
            throw new Error(error_messages_1.PLATFORM_BAD_CREDENTIALS);
        }
        if (err.message &&
            err.message.startsWith('ssh_exchange_identification: Connection closed by remote host')) {
            logger_1.logger.debug('Throwing bad credentials');
            throw new Error(error_messages_1.PLATFORM_BAD_CREDENTIALS);
        }
        if (err.message === error_messages_1.PLATFORM_BAD_CREDENTIALS) {
            logger_1.logger.debug('Passing bad-credentials error up');
            throw err;
        }
        if (err.message === error_messages_1.PLATFORM_INTEGRATION_UNAUTHORIZED) {
            logger_1.logger.debug('Passing integration-unauthorized error up');
            throw err;
        }
        if (err.message === error_messages_1.MANAGER_LOCKFILE_ERROR) {
            logger_1.logger.debug('Passing lockfile-error up');
            throw err;
        }
        if (err.message && err.message.includes('space left on device')) {
            throw new Error(error_messages_1.SYSTEM_INSUFFICIENT_DISK_SPACE);
        }
        if (err.message === error_messages_1.SYSTEM_INSUFFICIENT_DISK_SPACE) {
            logger_1.logger.debug('Passing disk-space error up');
            throw err;
        }
        if (err.message.startsWith('Resource not accessible by integration')) {
            logger_1.logger.debug('Passing 403 error up');
            throw err;
        }
        if (err.message === error_messages_1.WORKER_FILE_UPDATE_FAILED) {
            logger_1.logger.warn('Error updating branch: update failure');
        }
        else if (err.message.startsWith('bundler-')) {
            // we have already warned inside the bundler artifacts error handling, so just return
            return 'error';
        }
        else if (err.messagee &&
            err.message.includes('fatal: Authentication failed')) {
            throw new Error(error_messages_1.PLATFORM_AUTHENTICATION_ERROR);
        }
        else if (!(err instanceof external_host_error_1.ExternalHostError)) {
            logger_1.logger.error({ err }, `Error updating branch: ${err.message}`);
        }
        // Don't throw here - we don't want to stop the other renovations
        return 'error';
    }
    try {
        logger_1.logger.debug('Ensuring PR');
        logger_1.logger.debug(`There are ${config.errors.length} errors and ${config.warnings.length} warnings`);
        const { prResult: result, pr } = await pr_1.ensurePr(config);
        // TODO: ensurePr should check for automerge itself
        if (result === common_1.PrResult.AwaitingApproval) {
            return 'needs-pr-approval';
        }
        if (result === common_1.PrResult.AwaitingGreenBranch ||
            result === common_1.PrResult.AwaitingNotPending) {
            return 'pending';
        }
        if (pr) {
            const topic = emoji_1.emojify(':warning: Artifact update problem');
            if ((_h = config.artifactErrors) === null || _h === void 0 ? void 0 : _h.length) {
                logger_1.logger.warn({ artifactErrors: config.artifactErrors }, 'artifactErrors');
                let content = `Renovate failed to update `;
                content +=
                    config.artifactErrors.length > 1 ? 'artifacts' : 'an artifact';
                content +=
                    ' related to this branch. You probably do not want to merge this PR as-is.';
                content += emoji_1.emojify(`\n\n:recycle: Renovate will retry this branch, including artifacts, only when one of the following happens:\n\n`);
                content +=
                    ' - any of the package files in this branch needs updating, or \n';
                content += ' - the branch becomes conflicted, or\n';
                content +=
                    ' - you check the rebase/retry checkbox if found above, or\n';
                content +=
                    ' - you rename this PR\'s title to start with "rebase!" to trigger it manually';
                content += '\n\nThe artifact failure details are included below:\n\n';
                config.artifactErrors.forEach((error) => {
                    content += `##### File name: ${error.lockFile}\n\n`;
                    content += `\`\`\`\n${error.stderr}\n\`\`\`\n\n`;
                });
                if (!(config.suppressNotifications.includes('artifactErrors') ||
                    config.suppressNotifications.includes('lockFileErrors'))) {
                    if (config.dryRun) {
                        logger_1.logger.info('DRY-RUN: Would ensure lock file error comment in PR #' +
                            pr.number);
                    }
                    else {
                        await platform_1.platform.ensureComment({
                            number: pr.number,
                            topic,
                            content,
                        });
                    }
                }
                const context = `renovate/artifacts`;
                const description = 'Artifact file update failure';
                const state = types_1.BranchStatus.red;
                const existingState = await platform_1.platform.getBranchStatusCheck(config.branchName, context);
                // Check if state needs setting
                if (existingState !== state) {
                    logger_1.logger.debug(`Updating status check state to failed`);
                    if (config.dryRun) {
                        logger_1.logger.info('DRY-RUN: Would set branch status in ' + config.branchName);
                    }
                    else {
                        await platform_1.platform.setBranchStatus({
                            branchName: config.branchName,
                            context,
                            description,
                            state,
                        });
                    }
                }
            }
            else {
                if ((_j = config.updatedArtifacts) === null || _j === void 0 ? void 0 : _j.length) {
                    // istanbul ignore if
                    if (config.dryRun) {
                        logger_1.logger.info('DRY-RUN: Would ensure comment removal in PR #' + pr.number);
                    }
                    else {
                        // Remove artifacts error comment only if this run has successfully updated artifacts
                        await platform_1.platform.ensureCommentRemoval({ number: pr.number, topic });
                    }
                }
                const prAutomerged = await pr_1.checkAutoMerge(pr, config);
                if (prAutomerged) {
                    return 'automerged';
                }
            }
        }
    }
    catch (err) /* istanbul ignore next */ {
        if (err instanceof external_host_error_1.ExternalHostError ||
            [error_messages_1.PLATFORM_RATE_LIMIT_EXCEEDED, error_messages_1.REPOSITORY_CHANGED].includes(err.message)) {
            logger_1.logger.debug('Passing PR error up');
            throw err;
        }
        // Otherwise don't throw here - we don't want to stop the other renovations
        logger_1.logger.error({ err }, `Error ensuring PR: ${err.message}`);
    }
    if (!branchExists) {
        return 'pr-created';
    }
    return 'done';
}
exports.processBranch = processBranch;
//# sourceMappingURL=index.js.map