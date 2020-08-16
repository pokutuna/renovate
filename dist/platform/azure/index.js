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
exports.getVulnerabilityAlerts = exports.deleteLabel = exports.addReviewers = exports.addAssignees = exports.getIssueList = exports.ensureIssueClosing = exports.ensureIssue = exports.findIssue = exports.getPrBody = exports.mergePr = exports.setBranchStatus = exports.ensureCommentRemoval = exports.ensureComment = exports.updatePr = exports.createPr = exports.getBranchStatus = exports.getBranchStatusCheck = exports.deleteBranch = exports.getBranchPr = exports.findPr = exports.getPr = exports.getPrList = exports.setBaseBranch = exports.getRepoForceRebase = exports.initRepo = exports.getRepos = exports.initPlatform = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const error_messages_1 = require("../../constants/error-messages");
const platforms_1 = require("../../constants/platforms");
const pull_requests_1 = require("../../constants/pull-requests");
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const git = __importStar(require("../../util/git"));
const hostRules = __importStar(require("../../util/host-rules"));
const sanitize_1 = require("../../util/sanitize");
const url_1 = require("../../util/url");
const pr_body_1 = require("../utils/pr-body");
const azureApi = __importStar(require("./azure-got-wrapper"));
const azureHelper = __importStar(require("./azure-helper"));
let config = {};
const defaults = {
    hostType: platforms_1.PLATFORM_TYPE_AZURE,
};
function initPlatform({ endpoint, token, username, password, }) {
    if (!endpoint) {
        throw new Error('Init: You must configure an Azure DevOps endpoint');
    }
    if (!token && !(username && password)) {
        throw new Error('Init: You must configure an Azure DevOps token, or a username and password');
    }
    // TODO: Add a connection check that endpoint/token combination are valid
    const res = {
        endpoint: url_1.ensureTrailingSlash(endpoint),
    };
    defaults.endpoint = res.endpoint;
    azureApi.setEndpoint(res.endpoint);
    const platformConfig = {
        endpoint: defaults.endpoint,
    };
    return Promise.resolve(platformConfig);
}
exports.initPlatform = initPlatform;
async function getRepos() {
    logger_1.logger.debug('Autodiscovering Azure DevOps repositories');
    const azureApiGit = await azureApi.gitApi();
    const repos = await azureApiGit.getRepositories();
    return repos.map((repo) => `${repo.project.name}/${repo.name}`);
}
exports.getRepos = getRepos;
async function initRepo({ repository, localDir, azureWorkItemId, optimizeForDisabled, }) {
    var _a, _b;
    logger_1.logger.debug(`initRepo("${repository}")`);
    config = { repository, azureWorkItemId };
    const azureApiGit = await azureApi.gitApi();
    const repos = await azureApiGit.getRepositories();
    const names = azureHelper.getProjectAndRepo(repository);
    const repo = repos.filter((c) => c.name.toLowerCase() === names.repo.toLowerCase() &&
        c.project.name.toLowerCase() === names.project.toLowerCase())[0];
    logger_1.logger.debug({ repositoryDetails: repo }, 'Repository details');
    config.repoId = repo.id;
    config.project = repo.project.name;
    config.owner = '?owner?';
    logger_1.logger.debug(`${repository} owner = ${config.owner}`);
    // Use default branch as PR target unless later overridden
    const defaultBranch = repo.defaultBranch.replace('refs/heads/', '');
    logger_1.logger.debug(`${repository} default branch = ${defaultBranch}`);
    config.mergeMethod = await azureHelper.getMergeMethod(repo.id, names.project);
    config.repoForceRebase = false;
    if (optimizeForDisabled) {
        let renovateConfig;
        try {
            const json = await azureHelper.getFile(repo.id, 'renovate.json', defaultBranch);
            renovateConfig = JSON.parse(json);
        }
        catch (_c) {
            // Do nothing
        }
        if (renovateConfig && renovateConfig.enabled === false) {
            throw new Error(error_messages_1.REPOSITORY_DISABLED);
        }
    }
    const [projectName, repoName] = repository.split('/');
    const opts = hostRules.find({
        hostType: defaults.hostType,
        url: defaults.endpoint,
    });
    const url = defaults.endpoint +
        `${encodeURIComponent(projectName)}/_git/${encodeURIComponent(repoName)}`;
    await git.initRepo({
        ...config,
        localDir,
        url,
        extraCloneOpts: azureHelper.getStorageExtraCloneOpts(opts),
        gitAuthorName: (_a = global.gitAuthor) === null || _a === void 0 ? void 0 : _a.name,
        gitAuthorEmail: (_b = global.gitAuthor) === null || _b === void 0 ? void 0 : _b.email,
    });
    const repoConfig = {
        defaultBranch,
        isFork: false,
    };
    return repoConfig;
}
exports.initRepo = initRepo;
function getRepoForceRebase() {
    return Promise.resolve(config.repoForceRebase === true);
}
exports.getRepoForceRebase = getRepoForceRebase;
// istanbul ignore next
async function setBaseBranch(branchName) {
    logger_1.logger.debug(`Setting base branch to ${branchName}`);
    const baseBranchSha = await git.setBranch(branchName);
    return baseBranchSha;
}
exports.setBaseBranch = setBaseBranch;
// istanbul ignore next
async function abandonPr(prNo) {
    logger_1.logger.debug(`abandonPr(prNo)(${prNo})`);
    const azureApiGit = await azureApi.gitApi();
    await azureApiGit.updatePullRequest({
        status: 2,
    }, config.repoId, prNo);
}
async function getPrList() {
    logger_1.logger.debug('getPrList()');
    if (!config.prList) {
        const azureApiGit = await azureApi.gitApi();
        let prs = [];
        let fetchedPrs;
        let skip = 0;
        do {
            fetchedPrs = await azureApiGit.getPullRequests(config.repoId, { status: 4 }, config.project, 0, skip, 100);
            prs = prs.concat(fetchedPrs);
            skip += 100;
        } while (fetchedPrs.length > 0);
        config.prList = prs.map(azureHelper.getRenovatePRFormat);
        logger_1.logger.debug({ length: config.prList.length }, 'Retrieved Pull Requests');
    }
    return config.prList;
}
exports.getPrList = getPrList;
async function getPr(pullRequestId) {
    logger_1.logger.debug(`getPr(${pullRequestId})`);
    if (!pullRequestId) {
        return null;
    }
    const azurePr = (await getPrList()).find((item) => item.number === pullRequestId);
    if (!azurePr) {
        return null;
    }
    const azureApiGit = await azureApi.gitApi();
    const labels = await azureApiGit.getPullRequestLabels(config.repoId, pullRequestId);
    azurePr.labels = labels
        .filter((label) => label.active)
        .map((label) => label.name);
    azurePr.hasReviewers = is_1.default.nonEmptyArray(azurePr.reviewers);
    return azurePr;
}
exports.getPr = getPr;
async function findPr({ branchName, prTitle, state = pull_requests_1.PR_STATE_ALL, }) {
    let prsFiltered = [];
    try {
        const prs = await getPrList();
        prsFiltered = prs.filter((item) => item.sourceRefName === azureHelper.getNewBranchName(branchName));
        if (prTitle) {
            prsFiltered = prsFiltered.filter((item) => item.title === prTitle);
        }
        switch (state) {
            case pull_requests_1.PR_STATE_ALL:
                // no more filter needed, we can go further...
                break;
            case pull_requests_1.PR_STATE_NOT_OPEN:
                prsFiltered = prsFiltered.filter((item) => item.state !== pull_requests_1.PR_STATE_OPEN);
                break;
            default:
                prsFiltered = prsFiltered.filter((item) => item.state === state);
                break;
        }
    }
    catch (error) {
        logger_1.logger.error('findPr ' + error);
    }
    if (prsFiltered.length === 0) {
        return null;
    }
    return prsFiltered[0];
}
exports.findPr = findPr;
async function getBranchPr(branchName) {
    logger_1.logger.debug(`getBranchPr(${branchName})`);
    const existingPr = await findPr({
        branchName,
        state: pull_requests_1.PR_STATE_OPEN,
    });
    return existingPr ? getPr(existingPr.number) : null;
}
exports.getBranchPr = getBranchPr;
async function deleteBranch(branchName, abandonAssociatedPr = false) {
    await git.deleteBranch(branchName);
    if (abandonAssociatedPr) {
        const pr = await getBranchPr(branchName);
        await abandonPr(pr.number);
    }
}
exports.deleteBranch = deleteBranch;
async function getBranchStatusCheck(branchName, context) {
    logger_1.logger.trace(`getBranchStatusCheck(${branchName}, ${context})`);
    const azureApiGit = await azureApi.gitApi();
    const branch = await azureApiGit.getBranch(config.repoId, azureHelper.getBranchNameWithoutRefsheadsPrefix(branchName));
    if (branch.aheadCount === 0) {
        return types_1.BranchStatus.green;
    }
    return types_1.BranchStatus.yellow;
}
exports.getBranchStatusCheck = getBranchStatusCheck;
async function getBranchStatus(branchName, requiredStatusChecks) {
    logger_1.logger.debug(`getBranchStatus(${branchName})`);
    if (!requiredStatusChecks) {
        // null means disable status checks, so it always succeeds
        return types_1.BranchStatus.green;
    }
    if (requiredStatusChecks.length) {
        // This is Unsupported
        logger_1.logger.warn({ requiredStatusChecks }, `Unsupported requiredStatusChecks`);
        return types_1.BranchStatus.red;
    }
    const branchStatusCheck = await getBranchStatusCheck(branchName, null);
    return branchStatusCheck;
}
exports.getBranchStatus = getBranchStatus;
async function createPr({ branchName, targetBranch, prTitle: title, prBody: body, labels, draftPR = false, platformOptions = {}, }) {
    const sourceRefName = azureHelper.getNewBranchName(branchName);
    const targetRefName = azureHelper.getNewBranchName(targetBranch);
    const description = azureHelper.max4000Chars(sanitize_1.sanitize(body));
    const azureApiGit = await azureApi.gitApi();
    const workItemRefs = [
        {
            id: config.azureWorkItemId,
        },
    ];
    let pr = await azureApiGit.createPullRequest({
        sourceRefName,
        targetRefName,
        title,
        description,
        workItemRefs,
        isDraft: draftPR,
    }, config.repoId);
    if (platformOptions.azureAutoComplete) {
        pr = await azureApiGit.updatePullRequest({
            autoCompleteSetBy: {
                id: pr.createdBy.id,
            },
            completionOptions: {
                mergeStrategy: config.mergeMethod,
                deleteSourceBranch: true,
            },
        }, config.repoId, pr.pullRequestId);
    }
    await Promise.all(labels.map((label) => azureApiGit.createPullRequestLabel({
        name: label,
    }, config.repoId, pr.pullRequestId)));
    return azureHelper.getRenovatePRFormat(pr);
}
exports.createPr = createPr;
async function updatePr(prNo, title, body) {
    logger_1.logger.debug(`updatePr(${prNo}, ${title}, body)`);
    const azureApiGit = await azureApi.gitApi();
    const objToUpdate = {
        title,
    };
    if (body) {
        objToUpdate.description = azureHelper.max4000Chars(sanitize_1.sanitize(body));
    }
    await azureApiGit.updatePullRequest(objToUpdate, config.repoId, prNo);
}
exports.updatePr = updatePr;
async function ensureComment({ number, topic, content, }) {
    logger_1.logger.debug(`ensureComment(${number}, ${topic}, content)`);
    const header = topic ? `### ${topic}\n\n` : '';
    const body = `${header}${sanitize_1.sanitize(content)}`;
    const azureApiGit = await azureApi.gitApi();
    const threads = await azureApiGit.getThreads(config.repoId, number);
    let threadIdFound = null;
    let commentIdFound = null;
    let commentNeedsUpdating = false;
    threads.forEach((thread) => {
        const firstCommentContent = thread.comments[0].content;
        if ((topic && (firstCommentContent === null || firstCommentContent === void 0 ? void 0 : firstCommentContent.startsWith(header))) ||
            (!topic && firstCommentContent === body)) {
            threadIdFound = thread.id;
            commentIdFound = thread.comments[0].id;
            commentNeedsUpdating = firstCommentContent !== body;
        }
    });
    if (!threadIdFound) {
        await azureApiGit.createThread({
            comments: [{ content: body, commentType: 1, parentCommentId: 0 }],
            status: 1,
        }, config.repoId, number);
        logger_1.logger.info({ repository: config.repository, issueNo: number, topic }, 'Comment added');
    }
    else if (commentNeedsUpdating) {
        await azureApiGit.updateComment({
            content: body,
        }, config.repoId, number, threadIdFound, commentIdFound);
        logger_1.logger.debug({ repository: config.repository, issueNo: number, topic }, 'Comment updated');
    }
    else {
        logger_1.logger.debug({ repository: config.repository, issueNo: number, topic }, 'Comment is already update-to-date');
    }
    return true;
}
exports.ensureComment = ensureComment;
async function ensureCommentRemoval({ number: issueNo, topic, content, }) {
    var _a, _b;
    logger_1.logger.debug(`Ensuring comment "${topic || content}" in #${issueNo} is removed`);
    const azureApiGit = await azureApi.gitApi();
    const threads = await azureApiGit.getThreads(config.repoId, issueNo);
    const byTopic = (thread) => thread.comments[0].content.startsWith(`### ${topic}\n\n`);
    const byContent = (thread) => thread.comments[0].content.trim() === content;
    let threadIdFound = null;
    if (topic) {
        threadIdFound = (_a = threads.find(byTopic)) === null || _a === void 0 ? void 0 : _a.id;
    }
    else if (content) {
        threadIdFound = (_b = threads.find(byContent)) === null || _b === void 0 ? void 0 : _b.id;
    }
    if (threadIdFound) {
        await azureApiGit.updateThread({
            status: 4,
        }, config.repoId, issueNo, threadIdFound);
    }
}
exports.ensureCommentRemoval = ensureCommentRemoval;
function setBranchStatus({ branchName, context, description, state, url: targetUrl, }) {
    logger_1.logger.debug(`setBranchStatus(${branchName}, ${context}, ${description}, ${state}, ${targetUrl}) - Not supported by Azure DevOps (yet!)`);
    return Promise.resolve();
}
exports.setBranchStatus = setBranchStatus;
function mergePr(pr, branchName) {
    logger_1.logger.debug(`mergePr(pr)(${pr}) - Not supported by Azure DevOps (yet!)`);
    return Promise.resolve(false);
}
exports.mergePr = mergePr;
function getPrBody(input) {
    // Remove any HTML we use
    return pr_body_1.smartTruncate(input, 4000)
        .replace('you tick the rebase/retry checkbox', 'rename PR to start with "rebase!"')
        .replace(new RegExp(`\n---\n\n.*?<!-- rebase-check -->.*?\n`), '')
        .replace('<summary>', '**')
        .replace('</summary>', '**')
        .replace('<details>', '')
        .replace('</details>', '');
}
exports.getPrBody = getPrBody;
function findIssue() {
    logger_1.logger.warn(`findIssue() is not implemented`);
    return null;
}
exports.findIssue = findIssue;
function ensureIssue() {
    logger_1.logger.warn(`ensureIssue() is not implemented`);
    return Promise.resolve(null);
}
exports.ensureIssue = ensureIssue;
function ensureIssueClosing() {
    return Promise.resolve();
}
exports.ensureIssueClosing = ensureIssueClosing;
function getIssueList() {
    logger_1.logger.debug(`getIssueList()`);
    // TODO: Needs implementation
    return Promise.resolve([]);
}
exports.getIssueList = getIssueList;
async function getUserIds(users) {
    const azureApiGit = await azureApi.gitApi();
    const azureApiCore = await azureApi.coreApi();
    const repos = await azureApiGit.getRepositories();
    const repo = repos.filter((c) => c.id === config.repoId)[0];
    const teams = await azureApiCore.getTeams(repo.project.id);
    const members = await Promise.all(teams.map(async (t) => 
    /* eslint-disable no-return-await */
    await azureApiCore.getTeamMembersWithExtendedProperties(repo.project.id, t.id)));
    const ids = [];
    members.forEach((listMembers) => {
        listMembers.forEach((m) => {
            users.forEach((r) => {
                if (r.toLowerCase() === m.identity.displayName.toLowerCase() ||
                    r.toLowerCase() === m.identity.uniqueName.toLowerCase()) {
                    if (ids.filter((c) => c.id === m.identity.id).length === 0) {
                        ids.push({ id: m.identity.id, name: r });
                    }
                }
            });
        });
    });
    teams.forEach((t) => {
        users.forEach((r) => {
            if (r.toLowerCase() === t.name.toLowerCase()) {
                if (ids.filter((c) => c.id === t.id).length === 0) {
                    ids.push({ id: t.id, name: r });
                }
            }
        });
    });
    return ids;
}
/**
 *
 * @param {number} issueNo
 * @param {string[]} assignees
 */
async function addAssignees(issueNo, assignees) {
    logger_1.logger.trace(`addAssignees(${issueNo}, ${assignees})`);
    const ids = await getUserIds(assignees);
    await ensureComment({
        number: issueNo,
        topic: 'Add Assignees',
        content: ids.map((a) => `@<${a.id}>`).join(', '),
    });
}
exports.addAssignees = addAssignees;
/**
 *
 * @param {number} prNo
 * @param {string[]} reviewers
 */
async function addReviewers(prNo, reviewers) {
    logger_1.logger.trace(`addReviewers(${prNo}, ${reviewers})`);
    const azureApiGit = await azureApi.gitApi();
    const ids = await getUserIds(reviewers);
    await Promise.all(ids.map(async (obj) => {
        await azureApiGit.createPullRequestReviewer({}, config.repoId, prNo, obj.id);
        logger_1.logger.debug(`Reviewer added: ${obj.name}`);
    }));
}
exports.addReviewers = addReviewers;
async function deleteLabel(prNumber, label) {
    logger_1.logger.debug(`Deleting label ${label} from #${prNumber}`);
    const azureApiGit = await azureApi.gitApi();
    await azureApiGit.deletePullRequestLabels(config.repoId, prNumber, label);
}
exports.deleteLabel = deleteLabel;
function getVulnerabilityAlerts() {
    return Promise.resolve([]);
}
exports.getVulnerabilityAlerts = getVulnerabilityAlerts;
//# sourceMappingURL=index.js.map