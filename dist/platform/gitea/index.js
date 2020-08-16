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
exports.updatePr = exports.setBranchStatus = exports.setBaseBranch = exports.mergePr = exports.initRepo = exports.initPlatform = exports.getVulnerabilityAlerts = exports.getRepos = exports.getRepoForceRebase = exports.getPrList = exports.getPrBody = exports.getPr = exports.getIssueList = exports.getBranchStatusCheck = exports.getBranchStatus = exports.getBranchPr = exports.findPr = exports.findIssue = exports.ensureIssueClosing = exports.ensureIssue = exports.ensureCommentRemoval = exports.ensureComment = exports.deleteLabel = exports.deleteBranch = exports.createPr = exports.addReviewers = exports.addAssignees = void 0;
const url_1 = __importDefault(require("url"));
const is_1 = __importDefault(require("@sindresorhus/is"));
const app_strings_1 = require("../../config/app-strings");
const error_messages_1 = require("../../constants/error-messages");
const platforms_1 = require("../../constants/platforms");
const pull_requests_1 = require("../../constants/pull-requests");
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const git = __importStar(require("../../util/git"));
const hostRules = __importStar(require("../../util/host-rules"));
const gitea_1 = require("../../util/http/gitea");
const sanitize_1 = require("../../util/sanitize");
const url_2 = require("../../util/url");
const pr_body_1 = require("../utils/pr-body");
const helper = __importStar(require("./gitea-helper"));
const defaults = {
    hostType: platforms_1.PLATFORM_TYPE_GITEA,
    endpoint: 'https://gitea.com/api/v1/',
};
const defaultConfigFile = app_strings_1.configFileNames[0];
let config = {};
let botUserID;
function toRenovateIssue(data) {
    return {
        number: data.number,
        state: data.state,
        title: data.title,
        body: data.body,
    };
}
function toRenovatePR(data) {
    var _a, _b, _c, _d, _e, _f;
    if (!data) {
        return null;
    }
    if (!((_a = data.base) === null || _a === void 0 ? void 0 : _a.ref) ||
        !((_b = data.head) === null || _b === void 0 ? void 0 : _b.label) ||
        !((_c = data.head) === null || _c === void 0 ? void 0 : _c.sha) ||
        !((_e = (_d = data.head) === null || _d === void 0 ? void 0 : _d.repo) === null || _e === void 0 ? void 0 : _e.full_name)) {
        logger_1.logger.trace(`Skipping Pull Request #${data.number} due to missing base and/or head branch`);
        return null;
    }
    return {
        number: data.number,
        displayNumber: `Pull Request #${data.number}`,
        state: data.state,
        title: data.title,
        body: data.body,
        sha: data.head.sha,
        branchName: data.head.label,
        targetBranch: data.base.ref,
        sourceRepo: data.head.repo.full_name,
        createdAt: data.created_at,
        canMerge: data.mergeable,
        isConflicted: !data.mergeable,
        hasAssignees: !!(((_f = data.assignee) === null || _f === void 0 ? void 0 : _f.login) || is_1.default.nonEmptyArray(data.assignees)),
    };
}
function matchesState(actual, expected) {
    if (expected === pull_requests_1.PR_STATE_ALL) {
        return true;
    }
    if (expected.startsWith('!')) {
        return actual !== expected.substring(1);
    }
    return actual === expected;
}
function findCommentByTopic(comments, topic) {
    return comments.find((c) => c.body.startsWith(`### ${topic}\n\n`));
}
function findCommentByContent(comments, content) {
    return comments.find((c) => c.body.trim() === content);
}
async function retrieveDefaultConfig(repoPath, branchName) {
    const contents = await helper.getRepoContents(repoPath, defaultConfigFile, branchName);
    return JSON.parse(contents.contentString);
}
function getLabelList() {
    if (config.labelList === null) {
        const repoLabels = helper
            .getRepoLabels(config.repository, {
            useCache: false,
        })
            .then((labels) => {
            logger_1.logger.debug(`Retrieved ${labels.length} repo labels`);
            return labels;
        });
        const orgLabels = helper
            .getOrgLabels(config.repository.split('/')[0], {
            useCache: false,
        })
            .then((labels) => {
            logger_1.logger.debug(`Retrieved ${labels.length} org labels`);
            return labels;
        })
            .catch((err) => {
            // Will fail if owner of repo is not org or Gitea version < 1.12
            logger_1.logger.debug(`Unable to fetch organization labels`);
            return [];
        });
        config.labelList = Promise.all([repoLabels, orgLabels]).then((labels) => {
            return [].concat(...labels);
        });
    }
    return config.labelList;
}
async function lookupLabelByName(name) {
    var _a;
    logger_1.logger.debug(`lookupLabelByName(${name})`);
    const labelList = await getLabelList();
    return (_a = labelList.find((l) => l.name === name)) === null || _a === void 0 ? void 0 : _a.id;
}
const platform = {
    async initPlatform({ endpoint, token, }) {
        if (!token) {
            throw new Error('Init: You must configure a Gitea personal access token');
        }
        if (endpoint) {
            defaults.endpoint = url_2.ensureTrailingSlash(endpoint);
        }
        else {
            logger_1.logger.debug('Using default Gitea endpoint: ' + defaults.endpoint);
        }
        gitea_1.setBaseUrl(defaults.endpoint);
        let gitAuthor;
        try {
            const user = await helper.getCurrentUser({ token });
            gitAuthor = `${user.full_name || user.username} <${user.email}>`;
            botUserID = user.id;
        }
        catch (err) {
            logger_1.logger.debug({ err }, 'Error authenticating with Gitea. Check your token');
            throw new Error('Init: Authentication failure');
        }
        return {
            endpoint: defaults.endpoint,
            gitAuthor,
        };
    },
    async initRepo({ repository, localDir, optimizeForDisabled, }) {
        var _a, _b;
        let renovateConfig;
        let repo;
        config = {};
        config.repository = repository;
        config.localDir = localDir;
        // Attempt to fetch information about repository
        try {
            repo = await helper.getRepo(repository);
        }
        catch (err) {
            logger_1.logger.debug({ err }, 'Unknown Gitea initRepo error');
            throw err;
        }
        // Ensure appropriate repository state and permissions
        if (repo.archived) {
            logger_1.logger.debug('Repository is archived - throwing error to abort renovation');
            throw new Error(error_messages_1.REPOSITORY_ARCHIVED);
        }
        if (repo.mirror) {
            logger_1.logger.debug('Repository is a mirror - throwing error to abort renovation');
            throw new Error(error_messages_1.REPOSITORY_MIRRORED);
        }
        if (!repo.permissions.pull || !repo.permissions.push) {
            logger_1.logger.debug('Repository does not permit pull and push - throwing error to abort renovation');
            throw new Error(error_messages_1.REPOSITORY_ACCESS_FORBIDDEN);
        }
        if (repo.empty) {
            logger_1.logger.debug('Repository is empty - throwing error to abort renovation');
            throw new Error(error_messages_1.REPOSITORY_EMPTY);
        }
        if (repo.allow_rebase) {
            config.mergeMethod = 'rebase';
        }
        else if (repo.allow_rebase_explicit) {
            config.mergeMethod = 'rebase-merge';
        }
        else if (repo.allow_squash_merge) {
            config.mergeMethod = 'squash';
        }
        else if (repo.allow_merge_commits) {
            config.mergeMethod = 'merge';
        }
        else {
            logger_1.logger.debug('Repository has no allowed merge methods - throwing error to abort renovation');
            throw new Error(error_messages_1.REPOSITORY_BLOCKED);
        }
        // Determine author email and branches
        const defaultBranch = repo.default_branch;
        logger_1.logger.debug(`${repository} default branch = ${defaultBranch}`);
        // Optionally check if Renovate is disabled by attempting to fetch default configuration file
        if (optimizeForDisabled) {
            try {
                renovateConfig = await retrieveDefaultConfig(config.repository, defaultBranch);
            }
            catch (err) {
                // Do nothing
            }
            if (renovateConfig && renovateConfig.enabled === false) {
                throw new Error(error_messages_1.REPOSITORY_DISABLED);
            }
        }
        // Find options for current host and determine Git endpoint
        const opts = hostRules.find({
            hostType: platforms_1.PLATFORM_TYPE_GITEA,
            url: defaults.endpoint,
        });
        const gitEndpoint = url_1.default.parse(repo.clone_url);
        gitEndpoint.auth = opts.token;
        // Initialize Git storage
        await git.initRepo({
            ...config,
            url: url_1.default.format(gitEndpoint),
            gitAuthorName: (_a = global.gitAuthor) === null || _a === void 0 ? void 0 : _a.name,
            gitAuthorEmail: (_b = global.gitAuthor) === null || _b === void 0 ? void 0 : _b.email,
        });
        // Reset cached resources
        config.prList = null;
        config.issueList = null;
        config.labelList = null;
        return {
            defaultBranch,
            isFork: !!repo.fork,
        };
    },
    async getRepos() {
        logger_1.logger.debug('Auto-discovering Gitea repositories');
        try {
            const repos = await helper.searchRepos({ uid: botUserID });
            return repos.map((r) => r.full_name);
        }
        catch (err) {
            logger_1.logger.error({ err }, 'Gitea getRepos() error');
            throw err;
        }
    },
    async setBranchStatus({ branchName, context, description, state, url: target_url, }) {
        try {
            // Create new status for branch commit
            const branchCommit = await git.getBranchCommit(branchName);
            await helper.createCommitStatus(config.repository, branchCommit, {
                state: helper.renovateToGiteaStatusMapping[state] || 'pending',
                context,
                description,
                ...(target_url && { target_url }),
            });
            // Refresh caches by re-fetching commit status for branch
            await helper.getCombinedCommitStatus(config.repository, branchName, {
                useCache: false,
            });
        }
        catch (err) {
            logger_1.logger.warn({ err }, 'Failed to set branch status');
        }
    },
    async getBranchStatus(branchName, requiredStatusChecks) {
        if (!requiredStatusChecks) {
            return types_1.BranchStatus.green;
        }
        if (Array.isArray(requiredStatusChecks) && requiredStatusChecks.length) {
            logger_1.logger.warn({ requiredStatusChecks }, 'Unsupported requiredStatusChecks');
            return types_1.BranchStatus.red;
        }
        let ccs;
        try {
            ccs = await helper.getCombinedCommitStatus(config.repository, branchName);
        }
        catch (err) {
            if (err.statusCode === 404) {
                logger_1.logger.debug('Received 404 when checking branch status, assuming branch deletion');
                throw new Error(error_messages_1.REPOSITORY_CHANGED);
            }
            logger_1.logger.debug('Unknown error when checking branch status');
            throw err;
        }
        logger_1.logger.debug({ ccs }, 'Branch status check result');
        return (helper.giteaToRenovateStatusMapping[ccs.worstStatus] ||
            types_1.BranchStatus.yellow);
    },
    async getBranchStatusCheck(branchName, context) {
        const ccs = await helper.getCombinedCommitStatus(config.repository, branchName);
        const cs = ccs.statuses.find((s) => s.context === context);
        if (!cs) {
            return null;
        } // no status check exists
        const status = helper.giteaToRenovateStatusMapping[cs.status];
        if (status) {
            return status;
        }
        logger_1.logger.warn({ check: cs }, 'Could not map Gitea status value to Renovate status');
        return types_1.BranchStatus.yellow;
    },
    async setBaseBranch(branchName) {
        const baseBranchSha = await git.setBranch(branchName);
        return baseBranchSha;
    },
    getPrList() {
        if (config.prList === null) {
            config.prList = helper
                .searchPRs(config.repository, { state: 'all' }, { useCache: false })
                .then((prs) => {
                const prList = prs.map(toRenovatePR).filter(Boolean);
                logger_1.logger.debug(`Retrieved ${prList.length} Pull Requests`);
                return prList;
            });
        }
        return config.prList;
    },
    async getPr(number) {
        // Search for pull request in cached list or attempt to query directly
        const prList = await platform.getPrList();
        let pr = prList.find((p) => p.number === number);
        if (pr) {
            logger_1.logger.debug('Returning from cached PRs');
        }
        else {
            logger_1.logger.debug('PR not found in cached PRs - trying to fetch directly');
            const gpr = await helper.getPR(config.repository, number);
            pr = toRenovatePR(gpr);
            // Add pull request to cache for further lookups / queries
            if (config.prList !== null) {
                (await config.prList).push(pr);
            }
        }
        // Abort and return null if no match was found
        if (!pr) {
            return null;
        }
        return pr;
    },
    async findPr({ branchName, prTitle: title, state = pull_requests_1.PR_STATE_ALL, }) {
        logger_1.logger.debug(`findPr(${branchName}, ${title}, ${state})`);
        const prList = await platform.getPrList();
        const pr = prList.find((p) => p.sourceRepo === config.repository &&
            p.branchName === branchName &&
            matchesState(p.state, state) &&
            (!title || p.title === title));
        if (pr) {
            logger_1.logger.debug(`Found PR #${pr.number}`);
        }
        return pr !== null && pr !== void 0 ? pr : null;
    },
    async createPr({ branchName, targetBranch, prTitle: title, prBody: rawBody, labels: labelNames, }) {
        const base = targetBranch;
        const head = branchName;
        const body = sanitize_1.sanitize(rawBody);
        logger_1.logger.debug(`Creating pull request: ${title} (${head} => ${base})`);
        try {
            const labels = Array.isArray(labelNames)
                ? await Promise.all(labelNames.map(lookupLabelByName))
                : [];
            const gpr = await helper.createPR(config.repository, {
                base,
                head,
                title,
                body,
                labels: labels.filter(Boolean),
            });
            const pr = toRenovatePR(gpr);
            if (!pr) {
                throw new Error('Can not parse newly created Pull Request');
            }
            if (config.prList !== null) {
                (await config.prList).push(pr);
            }
            return pr;
        }
        catch (err) {
            // When the user manually deletes a branch from Renovate, the PR remains but is no longer linked to any branch. In
            // the most recent versions of Gitea, the PR gets automatically closed when that happens, but older versions do
            // not handle this properly and keep the PR open. As pushing a branch with the same name resurrects the PR, this
            // would cause a HTTP 409 conflict error, which we hereby gracefully handle.
            if (err.statusCode === 409) {
                logger_1.logger.warn(`Attempting to gracefully recover from 409 Conflict response in createPr(${title}, ${branchName})`);
                // Refresh cached PR list and search for pull request with matching information
                config.prList = null;
                const pr = await platform.findPr({
                    branchName,
                    state: pull_requests_1.PR_STATE_OPEN,
                });
                // If a valid PR was found, return and gracefully recover from the error. Otherwise, abort and throw error.
                if (pr) {
                    if (pr.title !== title || pr.body !== body) {
                        logger_1.logger.debug(`Recovered from 409 Conflict, but PR for ${branchName} is outdated. Updating...`);
                        await platform.updatePr(pr.number, title, body);
                        pr.title = title;
                        pr.body = body;
                    }
                    else {
                        logger_1.logger.debug(`Recovered from 409 Conflict and PR for ${branchName} is up-to-date`);
                    }
                    return pr;
                }
            }
            throw err;
        }
    },
    async updatePr(number, title, body) {
        await helper.updatePR(config.repository, number, {
            title,
            ...(body && { body }),
        });
    },
    async mergePr(number, branchName) {
        try {
            await helper.mergePR(config.repository, number, config.mergeMethod);
            return true;
        }
        catch (err) {
            logger_1.logger.warn({ err, number }, 'Merging of PR failed');
            return false;
        }
    },
    getIssueList() {
        if (config.issueList === null) {
            config.issueList = helper
                .searchIssues(config.repository, { state: 'all' }, { useCache: false })
                .then((issues) => {
                const issueList = issues.map(toRenovateIssue);
                logger_1.logger.debug(`Retrieved ${issueList.length} Issues`);
                return issueList;
            });
        }
        return config.issueList;
    },
    async findIssue(title) {
        const issueList = await platform.getIssueList();
        const issue = issueList.find((i) => i.state === 'open' && i.title === title);
        if (issue) {
            logger_1.logger.debug(`Found Issue #${issue.number}`);
        }
        return issue !== null && issue !== void 0 ? issue : null;
    },
    async ensureIssue({ title, reuseTitle, body, shouldReOpen, once, }) {
        logger_1.logger.debug(`ensureIssue(${title})`);
        try {
            const issueList = await platform.getIssueList();
            let issues = issueList.filter((i) => i.title === title);
            if (!issues.length) {
                issues = issueList.filter((i) => i.title === reuseTitle);
            }
            // Update any matching issues which currently exist
            if (issues.length) {
                let activeIssue = issues.find((i) => i.state === 'open');
                // If no active issue was found, decide if it shall be skipped, re-opened or updated without state change
                if (!activeIssue) {
                    if (once) {
                        logger_1.logger.debug('Issue already closed - skipping update');
                        return null;
                    }
                    if (shouldReOpen) {
                        logger_1.logger.debug('Reopening previously closed Issue');
                    }
                    // Pick the last issue in the list as the active one
                    activeIssue = issues[issues.length - 1];
                }
                // Close any duplicate issues
                for (const issue of issues) {
                    if (issue.state === 'open' && issue.number !== activeIssue.number) {
                        logger_1.logger.warn(`Closing duplicate Issue #${issue.number}`);
                        await helper.closeIssue(config.repository, issue.number);
                    }
                }
                // Check if issue has already correct state
                if (activeIssue.title === title &&
                    activeIssue.body === body &&
                    activeIssue.state === 'open') {
                    logger_1.logger.debug(`Issue #${activeIssue.number} is open and up to date - nothing to do`);
                    return null;
                }
                // Update issue body and re-open if enabled
                logger_1.logger.debug(`Updating Issue #${activeIssue.number}`);
                await helper.updateIssue(config.repository, activeIssue.number, {
                    body,
                    title,
                    state: shouldReOpen
                        ? 'open'
                        : activeIssue.state,
                });
                return 'updated';
            }
            // Create new issue and reset cache
            const issue = await helper.createIssue(config.repository, {
                body,
                title,
            });
            logger_1.logger.debug(`Created new Issue #${issue.number}`);
            config.issueList = null;
            return 'created';
        }
        catch (err) {
            logger_1.logger.warn({ err }, 'Could not ensure issue');
        }
        return null;
    },
    async ensureIssueClosing(title) {
        logger_1.logger.debug(`ensureIssueClosing(${title})`);
        const issueList = await platform.getIssueList();
        for (const issue of issueList) {
            if (issue.state === 'open' && issue.title === title) {
                logger_1.logger.debug({ number: issue.number }, 'Closing issue');
                await helper.closeIssue(config.repository, issue.number);
            }
        }
    },
    async deleteLabel(issue, labelName) {
        logger_1.logger.debug(`Deleting label ${labelName} from Issue #${issue}`);
        const label = await lookupLabelByName(labelName);
        if (label) {
            await helper.unassignLabel(config.repository, issue, label);
        }
        else {
            logger_1.logger.warn({ issue, labelName }, 'Failed to lookup label for deletion');
        }
        return null;
    },
    getRepoForceRebase() {
        return Promise.resolve(false);
    },
    async ensureComment({ number: issue, topic, content, }) {
        try {
            let body = sanitize_1.sanitize(content);
            const commentList = await helper.getComments(config.repository, issue);
            // Search comment by either topic or exact body
            let comment = null;
            if (topic) {
                comment = findCommentByTopic(commentList, topic);
                body = `### ${topic}\n\n${body}`;
            }
            else {
                comment = commentList.find((c) => c.body === body);
            }
            // Create a new comment if no match has been found, otherwise update if necessary
            if (!comment) {
                const c = await helper.createComment(config.repository, issue, body);
                logger_1.logger.info({ repository: config.repository, issue, comment: c.id }, 'Comment added');
            }
            else if (comment.body !== body) {
                const c = await helper.updateComment(config.repository, issue, body);
                logger_1.logger.debug({ repository: config.repository, issue, comment: c.id }, 'Comment updated');
            }
            else {
                logger_1.logger.debug(`Comment #${comment.id} is already up-to-date`);
            }
            return true;
        }
        catch (err) {
            logger_1.logger.warn({ err }, 'Error ensuring comment');
            return false;
        }
    },
    async ensureCommentRemoval({ number: issue, topic, content, }) {
        logger_1.logger.debug(`Ensuring comment "${topic || content}" in #${issue} is removed`);
        const commentList = await helper.getComments(config.repository, issue);
        let comment = null;
        if (topic) {
            comment = findCommentByTopic(commentList, topic);
        }
        else if (content) {
            comment = findCommentByContent(commentList, content);
        }
        // Abort and do nothing if no matching comment was found
        if (!comment) {
            return;
        }
        // Attempt to delete comment
        try {
            await helper.deleteComment(config.repository, comment.id);
        }
        catch (err) {
            logger_1.logger.warn({ err, issue, subject: topic }, 'Error deleting comment');
        }
    },
    async getBranchPr(branchName) {
        logger_1.logger.debug(`getBranchPr(${branchName})`);
        const pr = await platform.findPr({ branchName, state: pull_requests_1.PR_STATE_OPEN });
        return pr ? platform.getPr(pr.number) : null;
    },
    async deleteBranch(branchName, closePr) {
        logger_1.logger.debug(`deleteBranch(${branchName})`);
        if (closePr) {
            const pr = await platform.getBranchPr(branchName);
            if (pr) {
                await helper.closePR(config.repository, pr.number);
            }
        }
        return git.deleteBranch(branchName);
    },
    async addAssignees(number, assignees) {
        logger_1.logger.debug(`Updating assignees ${assignees} on Issue #${number}`);
        await helper.updateIssue(config.repository, number, {
            assignees,
        });
    },
    addReviewers(number, reviewers) {
        // Adding reviewers to a PR through API is not supported by Gitea as of today
        // See tracking issue: https://github.com/go-gitea/gitea/issues/5733
        logger_1.logger.debug(`Updating reviewers ${reviewers} on Pull Request #${number}`);
        logger_1.logger.warn('Unimplemented in Gitea: Reviewers');
        return Promise.resolve();
    },
    getPrBody(prBody) {
        return pr_body_1.smartTruncate(prBody, 1000000);
    },
    getVulnerabilityAlerts() {
        return Promise.resolve([]);
    },
};
// eslint-disable-next-line @typescript-eslint/unbound-method
exports.addAssignees = platform.addAssignees, exports.addReviewers = platform.addReviewers, exports.createPr = platform.createPr, exports.deleteBranch = platform.deleteBranch, exports.deleteLabel = platform.deleteLabel, exports.ensureComment = platform.ensureComment, exports.ensureCommentRemoval = platform.ensureCommentRemoval, exports.ensureIssue = platform.ensureIssue, exports.ensureIssueClosing = platform.ensureIssueClosing, exports.findIssue = platform.findIssue, exports.findPr = platform.findPr, exports.getBranchPr = platform.getBranchPr, exports.getBranchStatus = platform.getBranchStatus, exports.getBranchStatusCheck = platform.getBranchStatusCheck, exports.getIssueList = platform.getIssueList, exports.getPr = platform.getPr, exports.getPrBody = platform.getPrBody, exports.getPrList = platform.getPrList, exports.getRepoForceRebase = platform.getRepoForceRebase, exports.getRepos = platform.getRepos, exports.getVulnerabilityAlerts = platform.getVulnerabilityAlerts, exports.initPlatform = platform.initPlatform, exports.initRepo = platform.initRepo, exports.mergePr = platform.mergePr, exports.setBaseBranch = platform.setBaseBranch, exports.setBranchStatus = platform.setBranchStatus, exports.updatePr = platform.updatePr;
//# sourceMappingURL=index.js.map