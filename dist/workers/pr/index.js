"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAutoMerge = exports.ensurePr = exports.addAssigneesReviewers = void 0;
const error_messages_1 = require("../../constants/error-messages");
const logger_1 = require("../../logger");
const platform_1 = require("../../platform");
const types_1 = require("../../types");
const external_host_error_1 = require("../../types/errors/external-host-error");
const util_1 = require("../../util");
const git_1 = require("../../util/git");
const common_1 = require("../common");
const body_1 = require("./body");
const changelog_1 = require("./changelog");
const code_owners_1 = require("./code-owners");
function noWhitespaceOrHeadings(input) {
    return input.replace(/\r?\n|\r|\s|#/g, '');
}
function noLeadingAtSymbol(input) {
    return input.length && input.startsWith('@') ? input.slice(1) : input;
}
async function addCodeOwners(assigneesOrReviewers, pr) {
    return [...new Set(assigneesOrReviewers.concat(await code_owners_1.codeOwnersForPr(pr)))];
}
async function addAssigneesReviewers(config, pr) {
    let assignees = config.assignees;
    if (config.assigneesFromCodeOwners) {
        assignees = await addCodeOwners(assignees, pr);
    }
    if (assignees.length > 0) {
        try {
            assignees = assignees.map(noLeadingAtSymbol);
            if (config.assigneesSampleSize !== null) {
                assignees = util_1.sampleSize(assignees, config.assigneesSampleSize);
            }
            // istanbul ignore if
            if (config.dryRun) {
                logger_1.logger.info('DRY-RUN: Would add assignees to PR #' + pr.number);
            }
            else {
                await platform_1.platform.addAssignees(pr.number, assignees);
                logger_1.logger.debug({ assignees }, 'Added assignees');
            }
        }
        catch (err) {
            logger_1.logger.debug({ assignees: config.assignees, err }, 'Failed to add assignees');
        }
    }
    let reviewers = config.reviewers;
    if (config.reviewersFromCodeOwners) {
        reviewers = await addCodeOwners(reviewers, pr);
    }
    if (reviewers.length > 0) {
        try {
            reviewers = reviewers.map(noLeadingAtSymbol);
            if (config.additionalReviewers.length > 0) {
                const additionalReviewers = config.additionalReviewers.map(noLeadingAtSymbol);
                reviewers = [...new Set(reviewers.concat(additionalReviewers))];
            }
            if (config.reviewersSampleSize !== null) {
                reviewers = util_1.sampleSize(reviewers, config.reviewersSampleSize);
            }
            // istanbul ignore if
            if (config.dryRun) {
                logger_1.logger.info('DRY-RUN: Would add reviewers to PR #' + pr.number);
            }
            else {
                await platform_1.platform.addReviewers(pr.number, reviewers);
                logger_1.logger.debug({ reviewers }, 'Added reviewers');
            }
        }
        catch (err) {
            logger_1.logger.debug({ reviewers: config.reviewers, err }, 'Failed to add reviewers');
        }
    }
}
exports.addAssigneesReviewers = addAssigneesReviewers;
// Ensures that PR exists with matching title/body
async function ensurePr(prConfig) {
    var _a, _b, _c;
    const config = { ...prConfig };
    logger_1.logger.trace({ config }, 'ensurePr');
    // If there is a group, it will use the config of the first upgrade in the array
    const { branchName, prTitle, upgrades } = config;
    const dependencyDashboardCheck = (config.dependencyDashboardChecks || {})[config.branchName];
    // Check if existing PR exists
    const existingPr = await platform_1.platform.getBranchPr(branchName);
    if (existingPr) {
        logger_1.logger.debug('Found existing PR');
    }
    config.upgrades = [];
    if ((_a = config.artifactErrors) === null || _a === void 0 ? void 0 : _a.length) {
        logger_1.logger.debug('Forcing PR because of artifact errors');
        config.forcePr = true;
    }
    let branchStatus;
    async function getBranchStatus() {
        if (!branchStatus) {
            branchStatus = await platform_1.platform.getBranchStatus(branchName, config.requiredStatusChecks);
            logger_1.logger.debug({ branchStatus, branchName }, 'getBranchStatus() result');
        }
        return branchStatus;
    }
    // Only create a PR if a branch automerge has failed
    if (config.automerge === true &&
        config.automergeType.startsWith('branch') &&
        !config.forcePr) {
        logger_1.logger.debug(`Branch is configured for branch automerge, branch status) is: ${await getBranchStatus()}`);
        if ((await getBranchStatus()) === types_1.BranchStatus.yellow) {
            logger_1.logger.debug('Checking how long this branch has been pending');
            const lastCommitTime = await git_1.getBranchLastCommitTime(branchName);
            const currentTime = new Date();
            const millisecondsPerHour = 1000 * 60 * 60;
            const elapsedHours = Math.round((currentTime.getTime() - lastCommitTime.getTime()) / millisecondsPerHour);
            if (elapsedHours >= config.prNotPendingHours) {
                logger_1.logger.debug('Branch exceeds prNotPending hours - forcing PR creation');
                config.forcePr = true;
            }
        }
        if (config.forcePr || (await getBranchStatus()) === types_1.BranchStatus.red) {
            logger_1.logger.debug(`Branch tests failed, so will create PR`);
        }
        else {
            // Branch should be automerged, so we don't want to create a PR
            return { prResult: common_1.PrResult.BlockedByBranchAutomerge };
        }
    }
    if (config.prCreation === 'status-success') {
        logger_1.logger.debug('Checking branch combined status');
        if ((await getBranchStatus()) !== types_1.BranchStatus.green) {
            logger_1.logger.debug(`Branch status is "${await getBranchStatus()}" - not creating PR`);
            return { prResult: common_1.PrResult.AwaitingGreenBranch };
        }
        logger_1.logger.debug('Branch status success');
    }
    else if (config.prCreation === 'approval' &&
        !existingPr &&
        dependencyDashboardCheck !== 'approvePr') {
        return { prResult: common_1.PrResult.AwaitingApproval };
    }
    else if (config.prCreation === 'not-pending' &&
        !existingPr &&
        !config.forcePr) {
        logger_1.logger.debug('Checking branch combined status');
        if ((await getBranchStatus()) === types_1.BranchStatus.yellow) {
            logger_1.logger.debug(`Branch status is "${await getBranchStatus()}" - checking timeout`);
            const lastCommitTime = await git_1.getBranchLastCommitTime(branchName);
            const currentTime = new Date();
            const millisecondsPerHour = 1000 * 60 * 60;
            const elapsedHours = Math.round((currentTime.getTime() - lastCommitTime.getTime()) / millisecondsPerHour);
            if (!dependencyDashboardCheck &&
                elapsedHours < config.prNotPendingHours) {
                logger_1.logger.debug(`Branch is ${elapsedHours} hours old - skipping PR creation`);
                return { prResult: common_1.PrResult.AwaitingNotPending };
            }
            logger_1.logger.debug(`prNotPendingHours=${config.prNotPendingHours} threshold hit - creating PR`);
        }
        logger_1.logger.debug('Branch status success');
    }
    const processedUpgrades = [];
    const commitRepos = [];
    // Get changelog and then generate template strings
    for (const upgrade of upgrades) {
        const upgradeKey = `${upgrade.depType}-${upgrade.depName}-${upgrade.manager}-${upgrade.fromVersion || upgrade.currentValue}-${upgrade.toVersion}`;
        if (processedUpgrades.includes(upgradeKey)) {
            continue; // eslint-disable-line no-continue
        }
        processedUpgrades.push(upgradeKey);
        const logJSON = upgrade.logJSON;
        if (logJSON) {
            if (typeof logJSON.error === 'undefined') {
                if (logJSON.project) {
                    upgrade.repoName = logJSON.project.github
                        ? logJSON.project.github
                        : logJSON.project.gitlab;
                }
                upgrade.hasReleaseNotes = logJSON.hasReleaseNotes;
                upgrade.releases = [];
                if (upgrade.hasReleaseNotes &&
                    upgrade.repoName &&
                    !commitRepos.includes(upgrade.repoName)) {
                    commitRepos.push(upgrade.repoName);
                    if (logJSON.versions) {
                        logJSON.versions.forEach((version) => {
                            const release = { ...version };
                            upgrade.releases.push(release);
                        });
                    }
                }
            }
            else if (logJSON.error === changelog_1.ChangeLogError.MissingGithubToken) {
                upgrade.prBodyNotes = [
                    ...upgrade.prBodyNotes,
                    [
                        '\n',
                        ':warning: Release Notes retrieval for this PR were skipped because no github.com credentials were available.',
                        'If you are using the hosted GitLab app, please follow [this guide](https://docs.renovatebot.com/install-gitlab-app/#configuring-a-token-for-githubcom-hosted-release-notes). If you are self-hosted, please see [this instruction](https://github.com/renovatebot/renovate/blob/master/docs/development/self-hosting.md#githubcom-token-for-release-notes) instead.',
                        '\n',
                    ].join('\n'),
                ];
            }
        }
        config.upgrades.push(upgrade);
    }
    // Update the config object
    Object.assign(config, upgrades[0]);
    config.hasReleaseNotes = config.upgrades.some((upg) => upg.hasReleaseNotes);
    const releaseNoteRepos = [];
    for (const upgrade of config.upgrades) {
        if (upgrade.hasReleaseNotes) {
            if (releaseNoteRepos.includes(upgrade.sourceUrl)) {
                logger_1.logger.debug({ depName: upgrade.depName }, 'Removing duplicate release notes');
                upgrade.hasReleaseNotes = false;
            }
            else {
                releaseNoteRepos.push(upgrade.sourceUrl);
            }
        }
    }
    const prBody = await body_1.getPrBody(config);
    try {
        if (existingPr) {
            logger_1.logger.debug('Processing existing PR');
            // istanbul ignore if
            if (!existingPr.hasAssignees &&
                !existingPr.hasReviewers &&
                config.automerge &&
                (await getBranchStatus()) === types_1.BranchStatus.red) {
                logger_1.logger.debug(`Setting assignees and reviewers as status checks failed`);
                await addAssigneesReviewers(config, existingPr);
            }
            // Check if existing PR needs updating
            const reviewableIndex = existingPr.body.indexOf('<!-- Reviewable:start -->');
            let existingPrBody = existingPr.body;
            if (reviewableIndex > -1) {
                logger_1.logger.debug('Stripping Reviewable content');
                existingPrBody = existingPrBody.slice(0, reviewableIndex);
            }
            existingPrBody = existingPrBody.trim();
            if (existingPr.title === prTitle &&
                noWhitespaceOrHeadings(existingPrBody) ===
                    noWhitespaceOrHeadings(prBody)) {
                logger_1.logger.debug(`${existingPr.displayNumber} does not need updating`);
                return { prResult: common_1.PrResult.NotUpdated, pr: existingPr };
            }
            // PR must need updating
            if (existingPr.title !== prTitle) {
                logger_1.logger.debug({
                    branchName,
                    oldPrTitle: existingPr.title,
                    newPrTitle: prTitle,
                }, 'PR title changed');
            }
            else if (!config.committedFiles && !config.rebaseRequested) {
                logger_1.logger.debug({
                    prTitle,
                }, 'PR body changed');
            }
            // istanbul ignore if
            if (config.dryRun) {
                logger_1.logger.info('DRY-RUN: Would update PR #' + existingPr.number);
            }
            else {
                await platform_1.platform.updatePr(existingPr.number, prTitle, prBody);
                logger_1.logger.info({ pr: existingPr.number, prTitle }, `PR updated`);
            }
            return { prResult: common_1.PrResult.Updated, pr: existingPr };
        }
        logger_1.logger.debug({ branch: branchName, prTitle }, `Creating PR`);
        // istanbul ignore if
        if (config.updateType === 'rollback') {
            logger_1.logger.info('Creating Rollback PR');
        }
        let pr;
        try {
            // istanbul ignore if
            if (config.dryRun) {
                logger_1.logger.info('DRY-RUN: Would create PR: ' + prTitle);
                pr = { number: 0, displayNumber: 'Dry run PR' };
            }
            else {
                const platformOptions = {
                    azureAutoComplete: config.azureAutoComplete,
                    statusCheckVerify: config.statusCheckVerify,
                    gitLabAutomerge: config.automerge &&
                        config.automergeType === 'pr' &&
                        config.gitLabAutomerge,
                };
                pr = await platform_1.platform.createPr({
                    branchName,
                    targetBranch: config.baseBranch,
                    prTitle,
                    prBody,
                    labels: config.labels,
                    platformOptions,
                    draftPR: config.draftPR,
                });
                logger_1.logger.info({ pr: pr.number, prTitle }, 'PR created');
            }
        }
        catch (err) /* istanbul ignore next */ {
            logger_1.logger.debug({ err }, 'Pull request creation error');
            if (((_b = err.body) === null || _b === void 0 ? void 0 : _b.message) === 'Validation failed' && ((_c = err.body.errors) === null || _c === void 0 ? void 0 : _c.length) &&
                err.body.errors.some((error) => { var _a; return (_a = error.message) === null || _a === void 0 ? void 0 : _a.startsWith('A pull request already exists'); })) {
                logger_1.logger.warn('A pull requests already exists');
                return { prResult: common_1.PrResult.ErrorAlreadyExists };
            }
            if (err.statusCode === 502) {
                logger_1.logger.warn({ branch: branchName }, 'Deleting branch due to server error');
                if (config.dryRun) {
                    logger_1.logger.info('DRY-RUN: Would delete branch: ' + config.branchName);
                }
                else {
                    await platform_1.platform.deleteBranch(branchName);
                }
            }
            return { prResult: common_1.PrResult.Error };
        }
        if (config.branchAutomergeFailureMessage &&
            !config.suppressNotifications.includes('branchAutomergeFailure')) {
            const topic = 'Branch automerge failure';
            let content = 'This PR was configured for branch automerge, however this is not possible so it has been raised as a PR instead.';
            if (config.branchAutomergeFailureMessage === 'branch status error') {
                content += '\n___\n * Branch has one or more failed status checks';
            }
            logger_1.logger.debug('Adding branch automerge failure message to PR');
            // istanbul ignore if
            if (config.dryRun) {
                logger_1.logger.info('DRY-RUN: Would add comment to PR #' + pr.number);
            }
            else {
                await platform_1.platform.ensureComment({
                    number: pr.number,
                    topic,
                    content,
                });
            }
        }
        // Skip assign and review if automerging PR
        if (config.automerge &&
            !config.assignAutomerge &&
            (await getBranchStatus()) !== types_1.BranchStatus.red) {
            logger_1.logger.debug(`Skipping assignees and reviewers as automerge=${config.automerge}`);
        }
        else {
            await addAssigneesReviewers(config, pr);
        }
        logger_1.logger.debug(`Created ${pr.displayNumber}`);
        return { prResult: common_1.PrResult.Created, pr };
    }
    catch (err) {
        // istanbul ignore if
        if (err instanceof external_host_error_1.ExternalHostError ||
            err.message === error_messages_1.REPOSITORY_CHANGED ||
            err.message === error_messages_1.PLATFORM_RATE_LIMIT_EXCEEDED ||
            err.message === error_messages_1.PLATFORM_INTEGRATION_UNAUTHORIZED) {
            logger_1.logger.debug('Passing error up');
            throw err;
        }
        logger_1.logger.error({ err }, 'Failed to ensure PR: ' + prTitle);
    }
    return { prResult: common_1.PrResult.Error };
}
exports.ensurePr = ensurePr;
async function checkAutoMerge(pr, config) {
    logger_1.logger.trace({ config }, 'checkAutoMerge');
    const { branchName, automerge, automergeType, automergeComment, requiredStatusChecks, rebaseRequested, } = config;
    logger_1.logger.debug({ automerge, automergeType, automergeComment }, `Checking #${pr.number} for automerge`);
    if (automerge) {
        logger_1.logger.debug('PR is configured for automerge');
        // Return if PR not ready for automerge
        if (pr.isConflicted) {
            logger_1.logger.debug('PR is conflicted');
            logger_1.logger.debug({ pr });
            return false;
        }
        if (requiredStatusChecks && pr.canMerge !== true) {
            logger_1.logger.debug({ canMergeReason: pr.canMergeReason }, 'PR is not ready for merge');
            return false;
        }
        const branchStatus = await platform_1.platform.getBranchStatus(branchName, requiredStatusChecks);
        if (branchStatus !== types_1.BranchStatus.green) {
            logger_1.logger.debug(`PR is not ready for merge (branch status is ${branchStatus})`);
            return false;
        }
        // Check if it's been touched
        if (await git_1.isBranchModified(branchName)) {
            logger_1.logger.debug('PR is ready for automerge but has been modified');
            return false;
        }
        if (automergeType === 'pr-comment') {
            logger_1.logger.debug(`Applying automerge comment: ${automergeComment}`);
            // istanbul ignore if
            if (config.dryRun) {
                logger_1.logger.info('DRY-RUN: Would add PR automerge comment to PR #' + pr.number);
                return false;
            }
            if (rebaseRequested) {
                await platform_1.platform.ensureCommentRemoval({
                    number: pr.number,
                    content: automergeComment,
                });
            }
            return platform_1.platform.ensureComment({
                number: pr.number,
                topic: null,
                content: automergeComment,
            });
        }
        // Let's merge this
        logger_1.logger.debug(`Automerging #${pr.number}`);
        // istanbul ignore if
        if (config.dryRun) {
            logger_1.logger.info('DRY-RUN: Would merge PR #' + pr.number);
            return false;
        }
        const res = await platform_1.platform.mergePr(pr.number, branchName);
        if (res) {
            logger_1.logger.info({ pr: pr.number, prTitle: pr.title }, 'PR automerged');
        }
        return res;
    }
    logger_1.logger.debug('No automerge');
    return false;
}
exports.checkAutoMerge = checkAutoMerge;
//# sourceMappingURL=index.js.map