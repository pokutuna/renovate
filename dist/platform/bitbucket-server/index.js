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
exports.getVulnerabilityAlerts = exports.getPrBody = exports.mergePr = exports.updatePr = exports.createPr = exports.ensureCommentRemoval = exports.ensureComment = exports.deleteLabel = exports.addReviewers = exports.addAssignees = exports.ensureIssueClosing = exports.getIssueList = exports.ensureIssue = exports.findIssue = exports.setBranchStatus = exports.getBranchStatusCheck = exports.getBranchStatus = exports.deleteBranch = exports.refreshPr = exports.getBranchPr = exports.findPr = exports.getPrList = exports.getPr = exports.setBaseBranch = exports.getRepoForceRebase = exports.initRepo = exports.getRepos = exports.initPlatform = void 0;
const url_1 = __importStar(require("url"));
const is_1 = __importDefault(require("@sindresorhus/is"));
const delay_1 = __importDefault(require("delay"));
const error_messages_1 = require("../../constants/error-messages");
const platforms_1 = require("../../constants/platforms");
const pull_requests_1 = require("../../constants/pull-requests");
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const git = __importStar(require("../../util/git"));
const hostRules = __importStar(require("../../util/host-rules"));
const bitbucket_server_1 = require("../../util/http/bitbucket-server");
const sanitize_1 = require("../../util/sanitize");
const url_2 = require("../../util/url");
const pr_body_1 = require("../utils/pr-body");
const utils = __importStar(require("./utils"));
/*
 * Version: 5.3 (EOL Date: 15 Aug 2019)
 * See following docs for api information:
 * https://docs.atlassian.com/bitbucket-server/rest/5.3.0/bitbucket-rest.html
 * https://docs.atlassian.com/bitbucket-server/rest/5.3.0/bitbucket-build-rest.html
 *
 * See following page for uptodate supported versions
 * https://confluence.atlassian.com/support/atlassian-support-end-of-life-policy-201851003.html#AtlassianSupportEndofLifePolicy-BitbucketServer
 */
let config = {};
const bitbucketServerHttp = new bitbucket_server_1.BitbucketServerHttp();
const defaults = {
    hostType: platforms_1.PLATFORM_TYPE_BITBUCKET_SERVER,
};
/* istanbul ignore next */
function updatePrVersion(pr, version) {
    const res = Math.max(config.prVersions.get(pr) || 0, version);
    config.prVersions.set(pr, res);
    return res;
}
function initPlatform({ endpoint, username, password, }) {
    if (!endpoint) {
        throw new Error('Init: You must configure a Bitbucket Server endpoint');
    }
    if (!(username && password)) {
        throw new Error('Init: You must configure a Bitbucket Server username/password');
    }
    // TODO: Add a connection check that endpoint/username/password combination are valid
    defaults.endpoint = url_2.ensureTrailingSlash(endpoint);
    bitbucket_server_1.setBaseUrl(defaults.endpoint);
    const platformConfig = {
        endpoint: defaults.endpoint,
    };
    return Promise.resolve(platformConfig);
}
exports.initPlatform = initPlatform;
// Get all repositories that the user has access to
async function getRepos() {
    logger_1.logger.debug('Autodiscovering Bitbucket Server repositories');
    try {
        const repos = await utils.accumulateValues(`./rest/api/1.0/repos?permission=REPO_WRITE&state=AVAILABLE`);
        const result = repos.map((r) => `${r.project.key.toLowerCase()}/${r.slug}`);
        logger_1.logger.debug({ result }, 'result of getRepos()');
        return result;
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.error({ err }, `bitbucket getRepos error`);
        throw err;
    }
}
exports.getRepos = getRepos;
// Initialize GitLab by getting base branch
async function initRepo({ repository, localDir, optimizeForDisabled, bbUseDefaultReviewers, }) {
    var _a, _b;
    logger_1.logger.debug(`initRepo("${JSON.stringify({ repository, localDir }, null, 2)}")`);
    const opts = hostRules.find({
        hostType: defaults.hostType,
        url: defaults.endpoint,
    });
    const [projectKey, repositorySlug] = repository.split('/');
    if (optimizeForDisabled) {
        let renovateConfig;
        try {
            const { body } = await bitbucketServerHttp.getJson(`./rest/api/1.0/projects/${projectKey}/repos/${repositorySlug}/browse/renovate.json?limit=20000`);
            if (!body.isLastPage) {
                logger_1.logger.warn('Renovate config to big: ' + body.size);
            }
            else {
                renovateConfig = JSON.parse(body.lines.join());
            }
        }
        catch (_c) {
            // Do nothing
        }
        if (renovateConfig && renovateConfig.enabled === false) {
            throw new Error(error_messages_1.REPOSITORY_DISABLED);
        }
    }
    config = {
        projectKey,
        repositorySlug,
        repository,
        prVersions: new Map(),
        username: opts.username,
    };
    /* istanbul ignore else */
    if (bbUseDefaultReviewers !== false) {
        logger_1.logger.debug('Enable bitbucket default reviewer');
        config.bbUseDefaultReviewers = true;
    }
    const { host, pathname } = url_1.default.parse(defaults.endpoint);
    const gitUrl = git.getUrl({
        protocol: defaults.endpoint.split(':')[0],
        auth: `${opts.username}:${opts.password}`,
        host: `${host}${pathname}${pathname.endsWith('/') ? '' : /* istanbul ignore next */ '/'}scm`,
        repository,
    });
    await git.initRepo({
        ...config,
        localDir,
        url: gitUrl,
        gitAuthorName: (_a = global.gitAuthor) === null || _a === void 0 ? void 0 : _a.name,
        gitAuthorEmail: (_b = global.gitAuthor) === null || _b === void 0 ? void 0 : _b.email,
    });
    try {
        const info = (await bitbucketServerHttp.getJson(`./rest/api/1.0/projects/${config.projectKey}/repos/${config.repositorySlug}`)).body;
        config.owner = info.project.key;
        logger_1.logger.debug(`${repository} owner = ${config.owner}`);
        const defaultBranch = (await bitbucketServerHttp.getJson(`./rest/api/1.0/projects/${config.projectKey}/repos/${config.repositorySlug}/branches/default`)).body.displayId;
        config.mergeMethod = 'merge';
        const repoConfig = {
            defaultBranch,
            isFork: !!info.parent,
        };
        return repoConfig;
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.debug(err);
        if (err.statusCode === 404) {
            throw new Error(error_messages_1.REPOSITORY_NOT_FOUND);
        }
        logger_1.logger.debug({ err }, 'Unknown Bitbucket initRepo error');
        throw err;
    }
}
exports.initRepo = initRepo;
async function getRepoForceRebase() {
    var _a, _b, _c;
    logger_1.logger.debug(`getRepoForceRebase()`);
    // https://docs.atlassian.com/bitbucket-server/rest/7.0.1/bitbucket-rest.html#idp342
    const res = await bitbucketServerHttp.getJson(`./rest/api/1.0/projects/${config.projectKey}/repos/${config.repositorySlug}/settings/pull-requests`);
    // If the default merge strategy contains `ff-only` the PR can only be merged
    // if it is up to date with the base branch.
    // The current options for id are:
    // no-ff, ff, ff-only, rebase-no-ff, rebase-ff-only, squash, squash-ff-only
    return Boolean((_c = (_b = (_a = res.body) === null || _a === void 0 ? void 0 : _a.mergeConfig) === null || _b === void 0 ? void 0 : _b.defaultStrategy) === null || _c === void 0 ? void 0 : _c.id.includes('ff-only'));
}
exports.getRepoForceRebase = getRepoForceRebase;
async function setBaseBranch(branchName) {
    const baseBranchSha = await git.setBranch(branchName);
    return baseBranchSha;
}
exports.setBaseBranch = setBaseBranch;
// Gets details for a PR
async function getPr(prNo, refreshCache) {
    logger_1.logger.debug(`getPr(${prNo})`);
    if (!prNo) {
        return null;
    }
    const res = await bitbucketServerHttp.getJson(`./rest/api/1.0/projects/${config.projectKey}/repos/${config.repositorySlug}/pull-requests/${prNo}`, { useCache: !refreshCache });
    const pr = {
        displayNumber: `Pull Request #${res.body.id}`,
        ...utils.prInfo(res.body),
        reviewers: res.body.reviewers.map((r) => r.user.name),
    };
    pr.hasReviewers = is_1.default.nonEmptyArray(pr.reviewers);
    pr.version = updatePrVersion(pr.number, pr.version);
    if (pr.state === pull_requests_1.PR_STATE_OPEN) {
        const mergeRes = await bitbucketServerHttp.getJson(`./rest/api/1.0/projects/${config.projectKey}/repos/${config.repositorySlug}/pull-requests/${prNo}/merge`, { useCache: !refreshCache });
        pr.isConflicted = !!mergeRes.body.conflicted;
        pr.canMerge = !!mergeRes.body.canMerge;
    }
    return pr;
}
exports.getPr = getPr;
// TODO: coverage
// istanbul ignore next
function matchesState(state, desiredState) {
    if (desiredState === pull_requests_1.PR_STATE_ALL) {
        return true;
    }
    if (desiredState.startsWith('!')) {
        return state !== desiredState.substring(1);
    }
    return state === desiredState;
}
// TODO: coverage
// istanbul ignore next
const isRelevantPr = (branchName, prTitle, state) => (p) => p.branchName === branchName &&
    (!prTitle || p.title === prTitle) &&
    matchesState(p.state, state);
// TODO: coverage
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getPrList(_args) {
    logger_1.logger.debug(`getPrList()`);
    // istanbul ignore next
    if (!config.prList) {
        const query = new url_1.URLSearchParams({
            state: 'ALL',
            'role.1': 'AUTHOR',
            'username.1': config.username,
        }).toString();
        const values = await utils.accumulateValues(`./rest/api/1.0/projects/${config.projectKey}/repos/${config.repositorySlug}/pull-requests?${query}`);
        config.prList = values.map(utils.prInfo);
        logger_1.logger.debug({ length: config.prList.length }, 'Retrieved Pull Requests');
    }
    else {
        logger_1.logger.debug('returning cached PR list');
    }
    return config.prList;
}
exports.getPrList = getPrList;
// TODO: coverage
// istanbul ignore next
async function findPr({ branchName, prTitle, state = pull_requests_1.PR_STATE_ALL, refreshCache, }) {
    logger_1.logger.debug(`findPr(${branchName}, "${prTitle}", "${state}")`);
    const prList = await getPrList({ refreshCache });
    const pr = prList.find(isRelevantPr(branchName, prTitle, state));
    if (pr) {
        logger_1.logger.debug(`Found PR #${pr.number}`);
    }
    else {
        logger_1.logger.debug(`DID NOT Found PR from branch #${branchName}`);
    }
    return pr;
}
exports.findPr = findPr;
// Returns the Pull Request for a branch. Null if not exists.
async function getBranchPr(branchName) {
    logger_1.logger.debug(`getBranchPr(${branchName})`);
    const existingPr = await findPr({
        branchName,
        state: pull_requests_1.PR_STATE_OPEN,
    });
    return existingPr ? getPr(existingPr.number) : null;
}
exports.getBranchPr = getBranchPr;
// istanbul ignore next
async function refreshPr(number) {
    // wait for pr change propagation
    await delay_1.default(1000);
    // refresh cache
    await getPr(number, true);
}
exports.refreshPr = refreshPr;
async function deleteBranch(branchName, closePr = false) {
    logger_1.logger.debug(`deleteBranch(${branchName}, closePr=${closePr})`);
    // TODO: coverage
    // istanbul ignore next
    if (closePr) {
        // getBranchPr
        const pr = await getBranchPr(branchName);
        if (pr) {
            const { body } = await bitbucketServerHttp.postJson(`./rest/api/1.0/projects/${config.projectKey}/repos/${config.repositorySlug}/pull-requests/${pr.number}/decline?version=${pr.version}`);
            updatePrVersion(pr.number, body.version);
        }
    }
    return git.deleteBranch(branchName);
}
exports.deleteBranch = deleteBranch;
async function getStatus(branchName, useCache = true) {
    const branchCommit = await git.getBranchCommit(branchName);
    return (await bitbucketServerHttp.getJson(`./rest/build-status/1.0/commits/stats/${branchCommit}`, {
        useCache,
    })).body;
}
// Returns the combined status for a branch.
// umbrella for status checks
// https://docs.atlassian.com/bitbucket-server/rest/6.0.0/bitbucket-build-rest.html#idp2
async function getBranchStatus(branchName, requiredStatusChecks) {
    logger_1.logger.debug(`getBranchStatus(${branchName}, requiredStatusChecks=${!!requiredStatusChecks})`);
    if (!requiredStatusChecks) {
        // null means disable status checks, so it always succeeds
        logger_1.logger.debug('Status checks disabled = returning "success"');
        return types_1.BranchStatus.green;
    }
    if (!(await git.branchExists(branchName))) {
        throw new Error(error_messages_1.REPOSITORY_CHANGED);
    }
    try {
        const commitStatus = await getStatus(branchName);
        logger_1.logger.debug({ commitStatus }, 'branch status check result');
        if (commitStatus.failed > 0) {
            return types_1.BranchStatus.red;
        }
        if (commitStatus.inProgress > 0) {
            return types_1.BranchStatus.yellow;
        }
        return commitStatus.successful > 0
            ? types_1.BranchStatus.green
            : types_1.BranchStatus.yellow;
    }
    catch (err) {
        logger_1.logger.warn({ err }, `Failed to get branch status`);
        return types_1.BranchStatus.red;
    }
}
exports.getBranchStatus = getBranchStatus;
async function getStatusCheck(branchName, useCache = true) {
    const branchCommit = await git.getBranchCommit(branchName);
    return utils.accumulateValues(`./rest/build-status/1.0/commits/${branchCommit}`, 'get', { useCache });
}
// https://docs.atlassian.com/bitbucket-server/rest/6.0.0/bitbucket-build-rest.html#idp2
async function getBranchStatusCheck(branchName, context) {
    logger_1.logger.debug(`getBranchStatusCheck(${branchName}, context=${context})`);
    try {
        const states = await getStatusCheck(branchName);
        for (const state of states) {
            if (state.key === context) {
                switch (state.state) {
                    case 'SUCCESSFUL':
                        return types_1.BranchStatus.green;
                    case 'INPROGRESS':
                        return types_1.BranchStatus.yellow;
                    case 'FAILED':
                    default:
                        return types_1.BranchStatus.red;
                }
            }
        }
    }
    catch (err) {
        logger_1.logger.warn({ err }, `Failed to check branch status`);
    }
    return null;
}
exports.getBranchStatusCheck = getBranchStatusCheck;
async function setBranchStatus({ branchName, context, description, state, url: targetUrl, }) {
    logger_1.logger.debug(`setBranchStatus(${branchName})`);
    const existingStatus = await getBranchStatusCheck(branchName, context);
    if (existingStatus === state) {
        return;
    }
    logger_1.logger.debug({ branch: branchName, context, state }, 'Setting branch status');
    const branchCommit = await git.getBranchCommit(branchName);
    try {
        const body = {
            key: context,
            description,
            url: targetUrl || 'https://renovatebot.com',
        };
        switch (state) {
            case types_1.BranchStatus.green:
                body.state = 'SUCCESSFUL';
                break;
            case types_1.BranchStatus.yellow:
                body.state = 'INPROGRESS';
                break;
            case types_1.BranchStatus.red:
            default:
                body.state = 'FAILED';
                break;
        }
        await bitbucketServerHttp.postJson(`./rest/build-status/1.0/commits/${branchCommit}`, { body });
        // update status cache
        await getStatus(branchName, false);
        await getStatusCheck(branchName, false);
    }
    catch (err) {
        logger_1.logger.warn({ err }, `Failed to set branch status`);
    }
}
exports.setBranchStatus = setBranchStatus;
// Issue
// function getIssueList() {
//   logger.debug(`getIssueList()`);
//   // TODO: Needs implementation
//   // This is used by Renovate when creating its own issues, e.g. for deprecated package warnings, config error notifications, or "dependencyDashboard"
//   // BB Server doesnt have issues
//   return [];
// }
function findIssue(title) {
    logger_1.logger.debug(`findIssue(${title})`);
    // TODO: Needs implementation
    // This is used by Renovate when creating its own issues, e.g. for deprecated package warnings, config error notifications, or "dependencyDashboard"
    // BB Server doesnt have issues
    return null;
}
exports.findIssue = findIssue;
function ensureIssue({ title, }) {
    logger_1.logger.warn({ title }, 'Cannot ensure issue');
    // TODO: Needs implementation
    // This is used by Renovate when creating its own issues, e.g. for deprecated package warnings, config error notifications, or "dependencyDashboard"
    // BB Server doesnt have issues
    return null;
}
exports.ensureIssue = ensureIssue;
function getIssueList() {
    logger_1.logger.debug(`getIssueList()`);
    // TODO: Needs implementation
    return Promise.resolve([]);
}
exports.getIssueList = getIssueList;
function ensureIssueClosing(title) {
    logger_1.logger.debug(`ensureIssueClosing(${title})`);
    // TODO: Needs implementation
    // This is used by Renovate when creating its own issues, e.g. for deprecated package warnings, config error notifications, or "dependencyDashboard"
    // BB Server doesnt have issues
    return Promise.resolve();
}
exports.ensureIssueClosing = ensureIssueClosing;
function addAssignees(iid, assignees) {
    logger_1.logger.debug(`addAssignees(${iid}, ${assignees})`);
    // TODO: Needs implementation
    // Currently Renovate does "Create PR" and then "Add assignee" as a two-step process, with this being the second step.
    // BB Server doesnt support assignees
    return Promise.resolve();
}
exports.addAssignees = addAssignees;
async function addReviewers(prNo, reviewers) {
    logger_1.logger.debug(`Adding reviewers ${reviewers} to #${prNo}`);
    try {
        const pr = await getPr(prNo);
        if (!pr) {
            throw new Error(error_messages_1.REPOSITORY_NOT_FOUND);
        }
        const reviewersSet = new Set([...pr.reviewers, ...reviewers]);
        await bitbucketServerHttp.putJson(`./rest/api/1.0/projects/${config.projectKey}/repos/${config.repositorySlug}/pull-requests/${prNo}`, {
            body: {
                title: pr.title,
                version: pr.version,
                reviewers: Array.from(reviewersSet).map((name) => ({
                    user: { name },
                })),
            },
        });
        await getPr(prNo, true);
    }
    catch (err) {
        if (err.statusCode === 404) {
            throw new Error(error_messages_1.REPOSITORY_NOT_FOUND);
        }
        else if (err.statusCode === 409) {
            throw new Error(error_messages_1.REPOSITORY_CHANGED);
        }
        else {
            logger_1.logger.fatal({ err }, `Failed to add reviewers ${reviewers} to #${prNo}`);
            throw err;
        }
    }
}
exports.addReviewers = addReviewers;
function deleteLabel(issueNo, label) {
    logger_1.logger.debug(`deleteLabel(${issueNo}, ${label})`);
    // TODO: Needs implementation
    // Only used for the "request Renovate to rebase a PR using a label" feature
    return Promise.resolve();
}
exports.deleteLabel = deleteLabel;
async function getComments(prNo) {
    // GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/activities
    let comments = await utils.accumulateValues(`./rest/api/1.0/projects/${config.projectKey}/repos/${config.repositorySlug}/pull-requests/${prNo}/activities`);
    comments = comments
        .filter((a) => a.action === 'COMMENTED' && a.commentAction === 'ADDED')
        .map((a) => a.comment);
    logger_1.logger.debug(`Found ${comments.length} comments`);
    return comments;
}
async function addComment(prNo, text) {
    // POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments
    await bitbucketServerHttp.postJson(`./rest/api/1.0/projects/${config.projectKey}/repos/${config.repositorySlug}/pull-requests/${prNo}/comments`, {
        body: { text },
    });
}
async function getCommentVersion(prNo, commentId) {
    // GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments/{commentId}
    const { version } = (await bitbucketServerHttp.getJson(`./rest/api/1.0/projects/${config.projectKey}/repos/${config.repositorySlug}/pull-requests/${prNo}/comments/${commentId}`)).body;
    return version;
}
async function editComment(prNo, commentId, text) {
    const version = await getCommentVersion(prNo, commentId);
    // PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments/{commentId}
    await bitbucketServerHttp.putJson(`./rest/api/1.0/projects/${config.projectKey}/repos/${config.repositorySlug}/pull-requests/${prNo}/comments/${commentId}`, {
        body: { text, version },
    });
}
async function deleteComment(prNo, commentId) {
    const version = await getCommentVersion(prNo, commentId);
    // DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments/{commentId}
    await bitbucketServerHttp.deleteJson(`./rest/api/1.0/projects/${config.projectKey}/repos/${config.repositorySlug}/pull-requests/${prNo}/comments/${commentId}?version=${version}`);
}
async function ensureComment({ number, topic, content, }) {
    const sanitizedContent = sanitize_1.sanitize(content);
    try {
        const comments = await getComments(number);
        let body;
        let commentId;
        let commentNeedsUpdating;
        if (topic) {
            logger_1.logger.debug(`Ensuring comment "${topic}" in #${number}`);
            body = `### ${topic}\n\n${sanitizedContent}`;
            comments.forEach((comment) => {
                if (comment.text.startsWith(`### ${topic}\n\n`)) {
                    commentId = comment.id;
                    commentNeedsUpdating = comment.text !== body;
                }
            });
        }
        else {
            logger_1.logger.debug(`Ensuring content-only comment in #${number}`);
            body = `${sanitizedContent}`;
            comments.forEach((comment) => {
                if (comment.text === body) {
                    commentId = comment.id;
                    commentNeedsUpdating = false;
                }
            });
        }
        if (!commentId) {
            await addComment(number, body);
            logger_1.logger.info({ repository: config.repository, prNo: number, topic }, 'Comment added');
        }
        else if (commentNeedsUpdating) {
            await editComment(number, commentId, body);
            logger_1.logger.debug({ repository: config.repository, prNo: number }, 'Comment updated');
        }
        else {
            logger_1.logger.debug('Comment is already update-to-date');
        }
        return true;
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.warn({ err }, 'Error ensuring comment');
        return false;
    }
}
exports.ensureComment = ensureComment;
async function ensureCommentRemoval({ number: prNo, topic, content, }) {
    var _a, _b;
    try {
        logger_1.logger.debug(`Ensuring comment "${topic || content}" in #${prNo} is removed`);
        const comments = await getComments(prNo);
        const byTopic = (comment) => comment.text.startsWith(`### ${topic}\n\n`);
        const byContent = (comment) => comment.text.trim() === content;
        let commentId = null;
        if (topic) {
            commentId = (_a = comments.find(byTopic)) === null || _a === void 0 ? void 0 : _a.id;
        }
        else if (content) {
            commentId = (_b = comments.find(byContent)) === null || _b === void 0 ? void 0 : _b.id;
        }
        if (commentId) {
            await deleteComment(prNo, commentId);
        }
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.warn({ err }, 'Error ensuring comment removal');
    }
}
exports.ensureCommentRemoval = ensureCommentRemoval;
// Pull Request
const escapeHash = (input) => input ? input.replace(/#/g, '%23') : input;
async function createPr({ branchName, targetBranch, prTitle: title, prBody: rawDescription, }) {
    var _a, _b, _c;
    const description = sanitize_1.sanitize(rawDescription);
    logger_1.logger.debug(`createPr(${branchName}, title=${title})`);
    const base = targetBranch;
    let reviewers = [];
    /* istanbul ignore else */
    if (config.bbUseDefaultReviewers) {
        logger_1.logger.debug(`fetching default reviewers`);
        const { id } = (await bitbucketServerHttp.getJson(`./rest/api/1.0/projects/${config.projectKey}/repos/${config.repositorySlug}`)).body;
        const defReviewers = (await bitbucketServerHttp.getJson(`./rest/default-reviewers/1.0/projects/${config.projectKey}/repos/${config.repositorySlug}/reviewers?sourceRefId=refs/heads/${escapeHash(branchName)}&targetRefId=refs/heads/${base}&sourceRepoId=${id}&targetRepoId=${id}`)).body;
        reviewers = defReviewers.map((u) => ({
            user: { name: u.name },
        }));
    }
    const body = {
        title,
        description,
        fromRef: {
            id: `refs/heads/${branchName}`,
        },
        toRef: {
            id: `refs/heads/${base}`,
        },
        reviewers,
    };
    let prInfoRes;
    try {
        prInfoRes = await bitbucketServerHttp.postJson(`./rest/api/1.0/projects/${config.projectKey}/repos/${config.repositorySlug}/pull-requests`, { body });
    }
    catch (err) /* istanbul ignore next */ {
        if (((_c = (_b = (_a = err.body) === null || _a === void 0 ? void 0 : _a.errors) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.exceptionName) ===
            'com.atlassian.bitbucket.pull.EmptyPullRequestException') {
            logger_1.logger.debug('Empty pull request - deleting branch so it can be recreated next run');
            await deleteBranch(branchName);
            throw new Error(error_messages_1.REPOSITORY_CHANGED);
        }
        throw err;
    }
    const pr = {
        displayNumber: `Pull Request #${prInfoRes.body.id}`,
        ...utils.prInfo(prInfoRes.body),
    };
    updatePrVersion(pr.number, pr.version);
    // istanbul ignore if
    if (config.prList) {
        config.prList.push(pr);
    }
    return pr;
}
exports.createPr = createPr;
async function updatePr(prNo, title, rawDescription) {
    const description = sanitize_1.sanitize(rawDescription);
    logger_1.logger.debug(`updatePr(${prNo}, title=${title})`);
    try {
        const pr = await getPr(prNo);
        if (!pr) {
            throw Object.assign(new Error(error_messages_1.REPOSITORY_NOT_FOUND), { statusCode: 404 });
        }
        const { body } = await bitbucketServerHttp.putJson(`./rest/api/1.0/projects/${config.projectKey}/repos/${config.repositorySlug}/pull-requests/${prNo}`, {
            body: {
                title,
                description,
                version: pr.version,
                reviewers: pr.reviewers.map((name) => ({ user: { name } })),
            },
        });
        updatePrVersion(prNo, body.version);
    }
    catch (err) {
        if (err.statusCode === 404) {
            throw new Error(error_messages_1.REPOSITORY_NOT_FOUND);
        }
        else if (err.statusCode === 409) {
            throw new Error(error_messages_1.REPOSITORY_CHANGED);
        }
        else {
            logger_1.logger.fatal({ err }, `Failed to update PR`);
            throw err;
        }
    }
}
exports.updatePr = updatePr;
// https://docs.atlassian.com/bitbucket-server/rest/6.0.0/bitbucket-rest.html#idp261
async function mergePr(prNo, branchName) {
    logger_1.logger.debug(`mergePr(${prNo}, ${branchName})`);
    // Used for "automerge" feature
    try {
        const pr = await getPr(prNo);
        if (!pr) {
            throw Object.assign(new Error(error_messages_1.REPOSITORY_NOT_FOUND), { statusCode: 404 });
        }
        const { body } = await bitbucketServerHttp.postJson(`./rest/api/1.0/projects/${config.projectKey}/repos/${config.repositorySlug}/pull-requests/${prNo}/merge?version=${pr.version}`);
        updatePrVersion(prNo, body.version);
    }
    catch (err) {
        if (err.statusCode === 404) {
            throw new Error(error_messages_1.REPOSITORY_NOT_FOUND);
        }
        else if (err.statusCode === 409) {
            logger_1.logger.warn({ err }, `Failed to merge PR`);
            return false;
        }
        else {
            logger_1.logger.warn({ err }, `Failed to merge PR`);
            return false;
        }
    }
    logger_1.logger.debug({ pr: prNo }, 'PR merged');
    // Delete branch
    await deleteBranch(branchName);
    return true;
}
exports.mergePr = mergePr;
function getPrBody(input) {
    logger_1.logger.debug(`getPrBody(${input.split('\n')[0]})`);
    // Remove any HTML we use
    return pr_body_1.smartTruncate(input, 30000)
        .replace('you tick the rebase/retry checkbox', 'rename PR to start with "rebase!"')
        .replace(/<\/?summary>/g, '**')
        .replace(/<\/?details>/g, '')
        .replace(new RegExp(`\n---\n\n.*?<!-- rebase-check -->.*?(\n|$)`), '')
        .replace(new RegExp('<!--.*?-->', 'g'), '');
}
exports.getPrBody = getPrBody;
function getVulnerabilityAlerts() {
    logger_1.logger.debug(`getVulnerabilityAlerts()`);
    return Promise.resolve([]);
}
exports.getVulnerabilityAlerts = getVulnerabilityAlerts;
//# sourceMappingURL=index.js.map