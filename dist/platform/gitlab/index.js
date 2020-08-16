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
exports.getVulnerabilityAlerts = exports.findPr = exports.getPrList = exports.ensureCommentRemoval = exports.ensureComment = exports.deleteLabel = exports.addReviewers = exports.addAssignees = exports.ensureIssueClosing = exports.ensureIssue = exports.findIssue = exports.getIssueList = exports.setBranchStatus = exports.getBranchStatusCheck = exports.deleteBranch = exports.getBranchPr = exports.getPrBody = exports.mergePr = exports.updatePr = exports.getPr = exports.createPr = exports.getBranchStatus = exports.setBaseBranch = exports.getRepoForceRebase = exports.initRepo = exports.getRepos = exports.initPlatform = void 0;
const url_1 = __importStar(require("url"));
const is_1 = __importDefault(require("@sindresorhus/is"));
const delay_1 = __importDefault(require("delay"));
const app_strings_1 = require("../../config/app-strings");
const error_messages_1 = require("../../constants/error-messages");
const platforms_1 = require("../../constants/platforms");
const pull_requests_1 = require("../../constants/pull-requests");
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const git = __importStar(require("../../util/git"));
const hostRules = __importStar(require("../../util/host-rules"));
const gitlab_1 = require("../../util/http/gitlab");
const sanitize_1 = require("../../util/sanitize");
const url_2 = require("../../util/url");
const pr_body_1 = require("../utils/pr-body");
const gitlabApi = new gitlab_1.GitlabHttp();
const defaultConfigFile = app_strings_1.configFileNames[0];
let config = {};
const defaults = {
    hostType: platforms_1.PLATFORM_TYPE_GITLAB,
    endpoint: 'https://gitlab.com/api/v4/',
};
let authorId;
async function initPlatform({ endpoint, token, }) {
    if (!token) {
        throw new Error('Init: You must configure a GitLab personal access token');
    }
    if (endpoint) {
        defaults.endpoint = url_2.ensureTrailingSlash(endpoint);
        gitlab_1.setBaseUrl(defaults.endpoint);
    }
    else {
        logger_1.logger.debug('Using default GitLab endpoint: ' + defaults.endpoint);
    }
    let gitAuthor;
    try {
        const user = (await gitlabApi.getJson(`user`, { token })).body;
        gitAuthor = `${user.name} <${user.email}>`;
        authorId = user.id;
    }
    catch (err) {
        logger_1.logger.debug({ err }, 'Error authenticating with GitLab. Check that your token includes "user" permissions');
        throw new Error('Init: Authentication failure');
    }
    const platformConfig = {
        endpoint: defaults.endpoint,
        gitAuthor,
    };
    return platformConfig;
}
exports.initPlatform = initPlatform;
// Get all repositories that the user has access to
async function getRepos() {
    logger_1.logger.debug('Autodiscovering GitLab repositories');
    try {
        const url = `projects?membership=true&per_page=100&with_merge_requests_enabled=true&min_access_level=30`;
        const res = await gitlabApi.getJson(url, {
            paginate: true,
        });
        logger_1.logger.debug(`Discovered ${res.body.length} project(s)`);
        return res.body
            .filter((repo) => !repo.mirror && !repo.archived)
            .map((repo) => repo.path_with_namespace);
    }
    catch (err) {
        logger_1.logger.error({ err }, `GitLab getRepos error`);
        throw err;
    }
}
exports.getRepos = getRepos;
function urlEscape(str) {
    return str ? str.replace(/\//g, '%2F') : str;
}
// Initialize GitLab by getting base branch
async function initRepo({ repository, localDir, optimizeForDisabled, }) {
    var _a, _b;
    config = {};
    config.repository = urlEscape(repository);
    config.localDir = localDir;
    let res;
    let defaultBranch;
    try {
        res = await gitlabApi.getJson(`projects/${config.repository}`);
        if (res.body.archived) {
            logger_1.logger.debug('Repository is archived - throwing error to abort renovation');
            throw new Error(error_messages_1.REPOSITORY_ARCHIVED);
        }
        if (res.body.mirror) {
            logger_1.logger.debug('Repository is a mirror - throwing error to abort renovation');
            throw new Error(error_messages_1.REPOSITORY_MIRRORED);
        }
        if (res.body.repository_access_level === 'disabled') {
            logger_1.logger.debug('Repository portion of project is disabled - throwing error to abort renovation');
            throw new Error(error_messages_1.REPOSITORY_DISABLED);
        }
        if (res.body.merge_requests_access_level === 'disabled') {
            logger_1.logger.debug('MRs are disabled for the project - throwing error to abort renovation');
            throw new Error(error_messages_1.REPOSITORY_DISABLED);
        }
        if (res.body.default_branch === null || res.body.empty_repo) {
            throw new Error(error_messages_1.REPOSITORY_EMPTY);
        }
        if (optimizeForDisabled) {
            let renovateConfig;
            try {
                renovateConfig = JSON.parse(Buffer.from((await gitlabApi.getJson(`projects/${config.repository}/repository/files/${defaultConfigFile}?ref=${res.body.default_branch}`)).body.content, 'base64').toString());
            }
            catch (err) {
                // Do nothing
            }
            if (renovateConfig && renovateConfig.enabled === false) {
                throw new Error(error_messages_1.REPOSITORY_DISABLED);
            }
        }
        defaultBranch = res.body.default_branch;
        config.mergeMethod = res.body.merge_method || 'merge';
        logger_1.logger.debug(`${repository} default branch = ${defaultBranch}`);
        delete config.prList;
        logger_1.logger.debug('Enabling Git FS');
        const opts = hostRules.find({
            hostType: defaults.hostType,
            url: defaults.endpoint,
        });
        let url;
        if (process.env.GITLAB_IGNORE_REPO_URL ||
            res.body.http_url_to_repo === null) {
            logger_1.logger.debug('no http_url_to_repo found. Falling back to old behaviour.');
            const { host, protocol } = url_1.default.parse(defaults.endpoint);
            url = git.getUrl({
                protocol: protocol.slice(0, -1),
                auth: 'oauth2:' + opts.token,
                host,
                repository,
            });
        }
        else {
            logger_1.logger.debug(`${repository} http URL = ${res.body.http_url_to_repo}`);
            const repoUrl = url_1.default.parse(`${res.body.http_url_to_repo}`);
            repoUrl.auth = 'oauth2:' + opts.token;
            url = url_1.default.format(repoUrl);
        }
        await git.initRepo({
            ...config,
            url,
            gitAuthorName: (_a = global.gitAuthor) === null || _a === void 0 ? void 0 : _a.name,
            gitAuthorEmail: (_b = global.gitAuthor) === null || _b === void 0 ? void 0 : _b.email,
        });
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.debug({ err }, 'Caught initRepo error');
        if (err.message.includes('HEAD is not a symbolic ref')) {
            throw new Error(error_messages_1.REPOSITORY_EMPTY);
        }
        if ([error_messages_1.REPOSITORY_ARCHIVED, error_messages_1.REPOSITORY_EMPTY].includes(err.message)) {
            throw err;
        }
        if (err.statusCode === 403) {
            throw new Error(error_messages_1.REPOSITORY_ACCESS_FORBIDDEN);
        }
        if (err.statusCode === 404) {
            throw new Error(error_messages_1.REPOSITORY_NOT_FOUND);
        }
        if (err.message === error_messages_1.REPOSITORY_DISABLED) {
            throw err;
        }
        logger_1.logger.debug({ err }, 'Unknown GitLab initRepo error');
        throw err;
    }
    const repoConfig = {
        defaultBranch,
        isFork: !!res.body.forked_from_project,
    };
    return repoConfig;
}
exports.initRepo = initRepo;
function getRepoForceRebase() {
    return Promise.resolve((config === null || config === void 0 ? void 0 : config.mergeMethod) !== 'merge');
}
exports.getRepoForceRebase = getRepoForceRebase;
async function setBaseBranch(branchName) {
    const baseBranchSha = await git.setBranch(branchName);
    return baseBranchSha;
}
exports.setBaseBranch = setBaseBranch;
async function getStatus(branchName, useCache = true) {
    const branchSha = await git.getBranchCommit(branchName);
    const url = `projects/${config.repository}/repository/commits/${branchSha}/statuses`;
    return (await gitlabApi.getJson(url, {
        paginate: true,
        useCache,
    })).body;
}
const gitlabToRenovateStatusMapping = {
    pending: types_1.BranchStatus.yellow,
    created: types_1.BranchStatus.yellow,
    manual: types_1.BranchStatus.yellow,
    running: types_1.BranchStatus.yellow,
    success: types_1.BranchStatus.green,
    failed: types_1.BranchStatus.red,
    canceled: types_1.BranchStatus.red,
    skipped: types_1.BranchStatus.red,
};
// Returns the combined status for a branch.
async function getBranchStatus(branchName, requiredStatusChecks) {
    logger_1.logger.debug(`getBranchStatus(${branchName})`);
    if (!requiredStatusChecks) {
        // null means disable status checks, so it always succeeds
        return types_1.BranchStatus.green;
    }
    if (Array.isArray(requiredStatusChecks) && requiredStatusChecks.length) {
        // This is Unsupported
        logger_1.logger.warn({ requiredStatusChecks }, `Unsupported requiredStatusChecks`);
        return types_1.BranchStatus.red;
    }
    if (!(await git.branchExists(branchName))) {
        throw new Error(error_messages_1.REPOSITORY_CHANGED);
    }
    const res = await getStatus(branchName);
    logger_1.logger.debug(`Got res with ${res.length} results`);
    if (res.length === 0) {
        // Return 'pending' if we have no status checks
        return types_1.BranchStatus.yellow;
    }
    let status = types_1.BranchStatus.green; // default to green
    res
        .filter((check) => !check.allow_failure)
        .forEach((check) => {
        if (status !== types_1.BranchStatus.red) {
            // if red, stay red
            let mappedStatus = gitlabToRenovateStatusMapping[check.status];
            if (!mappedStatus) {
                logger_1.logger.warn({ check }, 'Could not map GitLab check.status to Renovate status');
                mappedStatus = types_1.BranchStatus.yellow;
            }
            if (mappedStatus !== types_1.BranchStatus.green) {
                logger_1.logger.trace({ check }, 'Found non-green check');
                status = mappedStatus;
            }
        }
    });
    return status;
}
exports.getBranchStatus = getBranchStatus;
// Pull Request
async function createPr({ branchName, targetBranch, prTitle: title, prBody: rawDescription, labels, platformOptions, }) {
    const description = sanitize_1.sanitize(rawDescription);
    logger_1.logger.debug(`Creating Merge Request: ${title}`);
    const res = await gitlabApi.postJson(`projects/${config.repository}/merge_requests`, {
        body: {
            source_branch: branchName,
            target_branch: targetBranch,
            remove_source_branch: true,
            title,
            description,
            labels: is_1.default.array(labels) ? labels.join(',') : null,
        },
    });
    const pr = res.body;
    pr.number = pr.iid;
    pr.branchName = branchName;
    pr.displayNumber = `Merge Request #${pr.iid}`;
    // istanbul ignore if
    if (config.prList) {
        config.prList.push(pr);
    }
    if (platformOptions === null || platformOptions === void 0 ? void 0 : platformOptions.gitLabAutomerge) {
        try {
            const desiredStatus = 'can_be_merged';
            const retryTimes = 5;
            // Check for correct merge request status before setting `merge_when_pipeline_succeeds` to  `true`.
            for (let attempt = 1; attempt <= retryTimes; attempt += 1) {
                const { body } = await gitlabApi.getJson(`projects/${config.repository}/merge_requests/${pr.iid}`);
                // Only continue if the merge request can be merged and has a pipeline.
                if (body.merge_status === desiredStatus && body.pipeline !== null) {
                    break;
                }
                await delay_1.default(500 * attempt);
            }
            await gitlabApi.putJson(`projects/${config.repository}/merge_requests/${pr.iid}/merge`, {
                body: {
                    should_remove_source_branch: true,
                    merge_when_pipeline_succeeds: true,
                },
            });
        }
        catch (err) /* istanbul ignore next */ {
            logger_1.logger.debug({ err }, 'Automerge on PR creation failed');
        }
    }
    return pr;
}
exports.createPr = createPr;
async function getPr(iid) {
    var _a, _b, _c;
    logger_1.logger.debug(`getPr(${iid})`);
    const url = `projects/${config.repository}/merge_requests/${iid}?include_diverged_commits_count=1`;
    const pr = (await gitlabApi.getJson(url)).body;
    // Harmonize fields with GitHub
    pr.branchName = pr.source_branch;
    pr.targetBranch = pr.target_branch;
    pr.number = pr.iid;
    pr.displayNumber = `Merge Request #${pr.iid}`;
    pr.body = pr.description;
    pr.state = pr.state === 'opened' ? pull_requests_1.PR_STATE_OPEN : pr.state;
    pr.hasAssignees = !!(((_a = pr.assignee) === null || _a === void 0 ? void 0 : _a.id) || ((_c = (_b = pr.assignees) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.id));
    delete pr.assignee;
    delete pr.assignees;
    pr.hasReviewers = false;
    if (pr.merge_status === 'cannot_be_merged') {
        logger_1.logger.debug('pr cannot be merged');
        pr.canMerge = false;
        pr.isConflicted = true;
    }
    else if (pr.state === pull_requests_1.PR_STATE_OPEN) {
        const branchStatus = await getBranchStatus(pr.branchName, []);
        if (branchStatus === types_1.BranchStatus.green) {
            pr.canMerge = true;
        }
    }
    return pr;
}
exports.getPr = getPr;
// istanbul ignore next
async function closePr(iid) {
    await gitlabApi.putJson(`projects/${config.repository}/merge_requests/${iid}`, {
        body: {
            state_event: 'close',
        },
    });
}
async function updatePr(iid, title, description) {
    await gitlabApi.putJson(`projects/${config.repository}/merge_requests/${iid}`, {
        body: {
            title,
            description: sanitize_1.sanitize(description),
        },
    });
}
exports.updatePr = updatePr;
async function mergePr(iid) {
    try {
        await gitlabApi.putJson(`projects/${config.repository}/merge_requests/${iid}/merge`, {
            body: {
                should_remove_source_branch: true,
            },
        });
        return true;
    }
    catch (err) /* istanbul ignore next */ {
        if (err.statusCode === 401) {
            logger_1.logger.debug('No permissions to merge PR');
            return false;
        }
        if (err.statusCode === 406) {
            logger_1.logger.debug({ err }, 'PR not acceptable for merging');
            return false;
        }
        logger_1.logger.debug({ err }, 'merge PR error');
        logger_1.logger.debug('PR merge failed');
        return false;
    }
}
exports.mergePr = mergePr;
function getPrBody(input) {
    return pr_body_1.smartTruncate(input
        .replace(/Pull Request/g, 'Merge Request')
        .replace(/PR/g, 'MR')
        .replace(/\]\(\.\.\/pull\//g, '](!'), 50000);
}
exports.getPrBody = getPrBody;
// Branch
// Returns the Pull Request for a branch. Null if not exists.
async function getBranchPr(branchName) {
    logger_1.logger.debug(`getBranchPr(${branchName})`);
    // istanbul ignore if
    if (!(await git.branchExists(branchName))) {
        return null;
    }
    const query = new url_1.URLSearchParams({
        per_page: '100',
        state: 'opened',
        source_branch: branchName,
    }).toString();
    const urlString = `projects/${config.repository}/merge_requests?${query}`;
    const res = await gitlabApi.getJson(urlString, {
        paginate: true,
    });
    logger_1.logger.debug(`Got res with ${res.body.length} results`);
    let pr = null;
    res.body.forEach((result) => {
        if (result.source_branch === branchName) {
            pr = result;
        }
    });
    if (!pr) {
        return null;
    }
    return getPr(pr.iid);
}
exports.getBranchPr = getBranchPr;
async function deleteBranch(branchName, shouldClosePr = false) {
    if (shouldClosePr) {
        logger_1.logger.debug('Closing PR');
        const pr = await getBranchPr(branchName);
        // istanbul ignore if
        if (pr) {
            await closePr(pr.number);
        }
    }
    return git.deleteBranch(branchName);
}
exports.deleteBranch = deleteBranch;
async function getBranchStatusCheck(branchName, context) {
    // cache-bust in case we have rebased
    const res = await getStatus(branchName, false);
    logger_1.logger.debug(`Got res with ${res.length} results`);
    for (const check of res) {
        if (check.name === context) {
            return gitlabToRenovateStatusMapping[check.status] || types_1.BranchStatus.yellow;
        }
    }
    return null;
}
exports.getBranchStatusCheck = getBranchStatusCheck;
async function setBranchStatus({ branchName, context, description, state: renovateState, url: targetUrl, }) {
    var _a, _b;
    // First, get the branch commit SHA
    const branchSha = await git.getBranchCommit(branchName);
    // Now, check the statuses for that commit
    const url = `projects/${config.repository}/statuses/${branchSha}`;
    let state = 'success';
    if (renovateState === types_1.BranchStatus.yellow) {
        state = 'pending';
    }
    else if (renovateState === types_1.BranchStatus.red) {
        state = 'failed';
    }
    const options = {
        state,
        description,
        context,
    };
    if (targetUrl) {
        options.target_url = targetUrl;
    }
    try {
        await gitlabApi.postJson(url, { body: options });
        // update status cache
        await getStatus(branchName, false);
    }
    catch (err) /* istanbul ignore next */ {
        if ((_b = (_a = err.body) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.startsWith('Cannot transition status via :enqueue from :pending')) {
            // https://gitlab.com/gitlab-org/gitlab-foss/issues/25807
            logger_1.logger.debug('Ignoring status transition error');
        }
        else {
            logger_1.logger.debug({ err });
            logger_1.logger.warn('Failed to set branch status');
        }
    }
}
exports.setBranchStatus = setBranchStatus;
// Issue
async function getIssueList() {
    if (!config.issueList) {
        const query = new url_1.URLSearchParams({
            per_page: '100',
            author_id: `${authorId}`,
            state: 'opened',
        }).toString();
        const res = await gitlabApi.getJson(`projects/${config.repository}/issues?${query}`, {
            useCache: false,
            paginate: true,
        });
        // istanbul ignore if
        if (!is_1.default.array(res.body)) {
            logger_1.logger.warn({ responseBody: res.body }, 'Could not retrieve issue list');
            return [];
        }
        config.issueList = res.body.map((i) => ({
            iid: i.iid,
            title: i.title,
        }));
    }
    return config.issueList;
}
exports.getIssueList = getIssueList;
async function findIssue(title) {
    logger_1.logger.debug(`findIssue(${title})`);
    try {
        const issueList = await getIssueList();
        const issue = issueList.find((i) => i.title === title);
        if (!issue) {
            return null;
        }
        const issueBody = (await gitlabApi.getJson(`projects/${config.repository}/issues/${issue.iid}`)).body.description;
        return {
            number: issue.iid,
            body: issueBody,
        };
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.warn('Error finding issue');
        return null;
    }
}
exports.findIssue = findIssue;
async function ensureIssue({ title, reuseTitle, body, }) {
    logger_1.logger.debug(`ensureIssue()`);
    const description = getPrBody(sanitize_1.sanitize(body));
    try {
        const issueList = await getIssueList();
        let issue = issueList.find((i) => i.title === title);
        if (!issue) {
            issue = issueList.find((i) => i.title === reuseTitle);
        }
        if (issue) {
            const existingDescription = (await gitlabApi.getJson(`projects/${config.repository}/issues/${issue.iid}`)).body.description;
            if (issue.title !== title || existingDescription !== description) {
                logger_1.logger.debug('Updating issue');
                await gitlabApi.putJson(`projects/${config.repository}/issues/${issue.iid}`, {
                    body: { title, description },
                });
                return 'updated';
            }
        }
        else {
            await gitlabApi.postJson(`projects/${config.repository}/issues`, {
                body: {
                    title,
                    description,
                },
            });
            logger_1.logger.info('Issue created');
            // delete issueList so that it will be refetched as necessary
            delete config.issueList;
            return 'created';
        }
    }
    catch (err) /* istanbul ignore next */ {
        if (err.message.startsWith('Issues are disabled for this repo')) {
            logger_1.logger.debug(`Could not create issue: ${err.message}`);
        }
        else {
            logger_1.logger.warn({ err }, 'Could not ensure issue');
        }
    }
    return null;
}
exports.ensureIssue = ensureIssue;
async function ensureIssueClosing(title) {
    logger_1.logger.debug(`ensureIssueClosing()`);
    const issueList = await getIssueList();
    for (const issue of issueList) {
        if (issue.title === title) {
            logger_1.logger.debug({ issue }, 'Closing issue');
            await gitlabApi.putJson(`projects/${config.repository}/issues/${issue.iid}`, {
                body: { state_event: 'close' },
            });
        }
    }
}
exports.ensureIssueClosing = ensureIssueClosing;
async function addAssignees(iid, assignees) {
    logger_1.logger.debug(`Adding assignees ${assignees} to #${iid}`);
    try {
        let assigneeId = (await gitlabApi.getJson(`users?username=${assignees[0]}`)).body[0].id;
        let url = `projects/${config.repository}/merge_requests/${iid}?assignee_id=${assigneeId}`;
        await gitlabApi.putJson(url);
        try {
            if (assignees.length > 1) {
                url = `projects/${config.repository}/merge_requests/${iid}?assignee_ids[]=${assigneeId}`;
                for (let i = 1; i < assignees.length; i += 1) {
                    assigneeId = (await gitlabApi.getJson(`users?username=${assignees[i]}`)).body[0].id;
                    url += `&assignee_ids[]=${assigneeId}`;
                }
                await gitlabApi.putJson(url);
            }
        }
        catch (error) {
            logger_1.logger.error({ iid, assignees }, 'Failed to add multiple assignees');
        }
    }
    catch (err) {
        logger_1.logger.debug({ err }, 'addAssignees error');
        logger_1.logger.warn({ iid, assignees }, 'Failed to add assignees');
    }
}
exports.addAssignees = addAssignees;
function addReviewers(iid, reviewers) {
    logger_1.logger.debug(`addReviewers('${iid}, '${reviewers})`);
    logger_1.logger.warn('Unimplemented in GitLab: approvals');
    return Promise.resolve();
}
exports.addReviewers = addReviewers;
async function deleteLabel(issueNo, label) {
    logger_1.logger.debug(`Deleting label ${label} from #${issueNo}`);
    try {
        const pr = await getPr(issueNo);
        const labels = (pr.labels || []).filter((l) => l !== label).join();
        await gitlabApi.putJson(`projects/${config.repository}/merge_requests/${issueNo}`, {
            body: { labels },
        });
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.warn({ err, issueNo, label }, 'Failed to delete label');
    }
}
exports.deleteLabel = deleteLabel;
async function getComments(issueNo) {
    // GET projects/:owner/:repo/merge_requests/:number/notes
    logger_1.logger.debug(`Getting comments for #${issueNo}`);
    const url = `projects/${config.repository}/merge_requests/${issueNo}/notes`;
    const comments = (await gitlabApi.getJson(url, { paginate: true })).body;
    logger_1.logger.debug(`Found ${comments.length} comments`);
    return comments;
}
async function addComment(issueNo, body) {
    // POST projects/:owner/:repo/merge_requests/:number/notes
    await gitlabApi.postJson(`projects/${config.repository}/merge_requests/${issueNo}/notes`, {
        body: { body },
    });
}
async function editComment(issueNo, commentId, body) {
    // PUT projects/:owner/:repo/merge_requests/:number/notes/:id
    await gitlabApi.putJson(`projects/${config.repository}/merge_requests/${issueNo}/notes/${commentId}`, {
        body: { body },
    });
}
async function deleteComment(issueNo, commentId) {
    // DELETE projects/:owner/:repo/merge_requests/:number/notes/:id
    await gitlabApi.deleteJson(`projects/${config.repository}/merge_requests/${issueNo}/notes/${commentId}`);
}
async function ensureComment({ number, topic, content, }) {
    const sanitizedContent = sanitize_1.sanitize(content);
    const massagedTopic = topic
        ? topic.replace(/Pull Request/g, 'Merge Request').replace(/PR/g, 'MR')
        : topic;
    const comments = await getComments(number);
    let body;
    let commentId;
    let commentNeedsUpdating;
    if (topic) {
        logger_1.logger.debug(`Ensuring comment "${massagedTopic}" in #${number}`);
        body = `### ${topic}\n\n${sanitizedContent}`;
        body = body.replace(/Pull Request/g, 'Merge Request').replace(/PR/g, 'MR');
        comments.forEach((comment) => {
            if (comment.body.startsWith(`### ${massagedTopic}\n\n`)) {
                commentId = comment.id;
                commentNeedsUpdating = comment.body !== body;
            }
        });
    }
    else {
        logger_1.logger.debug(`Ensuring content-only comment in #${number}`);
        body = `${sanitizedContent}`;
        comments.forEach((comment) => {
            if (comment.body === body) {
                commentId = comment.id;
                commentNeedsUpdating = false;
            }
        });
    }
    if (!commentId) {
        await addComment(number, body);
        logger_1.logger.debug({ repository: config.repository, issueNo: number }, 'Added comment');
    }
    else if (commentNeedsUpdating) {
        await editComment(number, commentId, body);
        logger_1.logger.debug({ repository: config.repository, issueNo: number }, 'Updated comment');
    }
    else {
        logger_1.logger.debug('Comment is already update-to-date');
    }
    return true;
}
exports.ensureComment = ensureComment;
async function ensureCommentRemoval({ number: issueNo, topic, content, }) {
    var _a, _b;
    logger_1.logger.debug(`Ensuring comment "${topic || content}" in #${issueNo} is removed`);
    const comments = await getComments(issueNo);
    let commentId = null;
    const byTopic = (comment) => comment.body.startsWith(`### ${topic}\n\n`);
    const byContent = (comment) => comment.body.trim() === content;
    if (topic) {
        commentId = (_a = comments.find(byTopic)) === null || _a === void 0 ? void 0 : _a.id;
    }
    else if (content) {
        commentId = (_b = comments.find(byContent)) === null || _b === void 0 ? void 0 : _b.id;
    }
    if (commentId) {
        await deleteComment(issueNo, commentId);
    }
}
exports.ensureCommentRemoval = ensureCommentRemoval;
async function fetchPrList() {
    const query = new url_1.URLSearchParams({
        per_page: '100',
        author_id: `${authorId}`,
    }).toString();
    const urlString = `projects/${config.repository}/merge_requests?${query}`;
    try {
        const res = await gitlabApi.getJson(urlString, { paginate: true });
        return res.body.map((pr) => ({
            number: pr.iid,
            branchName: pr.source_branch,
            title: pr.title,
            state: pr.state === 'opened' ? pull_requests_1.PR_STATE_OPEN : pr.state,
            createdAt: pr.created_at,
        }));
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.debug({ err }, 'Error fetching PR list');
        if (err.statusCode === 403) {
            throw new Error(error_messages_1.PLATFORM_AUTHENTICATION_ERROR);
        }
        throw err;
    }
}
async function getPrList() {
    if (!config.prList) {
        config.prList = await fetchPrList();
    }
    return config.prList;
}
exports.getPrList = getPrList;
function matchesState(state, desiredState) {
    if (desiredState === pull_requests_1.PR_STATE_ALL) {
        return true;
    }
    if (desiredState.startsWith('!')) {
        return state !== desiredState.substring(1);
    }
    return state === desiredState;
}
async function findPr({ branchName, prTitle, state = pull_requests_1.PR_STATE_ALL, }) {
    logger_1.logger.debug(`findPr(${branchName}, ${prTitle}, ${state})`);
    const prList = await getPrList();
    return prList.find((p) => p.branchName === branchName &&
        (!prTitle || p.title === prTitle) &&
        matchesState(p.state, state));
}
exports.findPr = findPr;
function getVulnerabilityAlerts() {
    return Promise.resolve([]);
}
exports.getVulnerabilityAlerts = getVulnerabilityAlerts;
//# sourceMappingURL=index.js.map