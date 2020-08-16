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
exports.getVulnerabilityAlerts = exports.getPrBody = exports.mergePr = exports.updatePr = exports.createPr = exports.ensureCommentRemoval = exports.ensureComment = exports.deleteLabel = exports.addReviewers = exports.addAssignees = exports.ensureIssueClosing = exports.ensureIssue = exports.findIssue = exports.getIssueList = exports.setBranchStatus = exports.getBranchStatusCheck = exports.getBranchStatus = exports.getBranchPr = exports.findPr = exports.getPrList = exports.getPr = exports.deleteBranch = exports.setBaseBranch = exports.getRepoForceRebase = exports.initRepo = exports.getRepos = exports.initPlatform = void 0;
const url_1 = __importDefault(require("url"));
const is_1 = __importDefault(require("@sindresorhus/is"));
const delay_1 = __importDefault(require("delay"));
const app_strings_1 = require("../../config/app-strings");
const error_messages_1 = require("../../constants/error-messages");
const platforms_1 = require("../../constants/platforms");
const pull_requests_1 = require("../../constants/pull-requests");
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const external_host_error_1 = require("../../types/errors/external-host-error");
const git = __importStar(require("../../util/git"));
const hostRules = __importStar(require("../../util/host-rules"));
const githubHttp = __importStar(require("../../util/http/github"));
const sanitize_1 = require("../../util/sanitize");
const url_2 = require("../../util/url");
const pr_body_1 = require("../utils/pr-body");
const user_1 = require("./user");
const githubApi = new githubHttp.GithubHttp();
const defaultConfigFile = app_strings_1.configFileNames[0];
let config = {};
const defaults = {
    hostType: platforms_1.PLATFORM_TYPE_GITHUB,
    endpoint: 'https://api.github.com/',
};
const escapeHash = (input) => input ? input.replace(/#/g, '%23') : input;
async function initPlatform({ endpoint, token, username, gitAuthor, }) {
    if (!token) {
        throw new Error('Init: You must configure a GitHub personal access token');
    }
    if (endpoint) {
        defaults.endpoint = url_2.ensureTrailingSlash(endpoint);
        githubHttp.setBaseUrl(defaults.endpoint);
    }
    else {
        logger_1.logger.debug('Using default github endpoint: ' + defaults.endpoint);
    }
    let userDetails;
    let renovateUsername;
    if (username) {
        renovateUsername = username;
    }
    else {
        userDetails = await user_1.getUserDetails(defaults.endpoint, token);
        renovateUsername = userDetails.username;
    }
    let discoveredGitAuthor;
    if (!gitAuthor) {
        userDetails = await user_1.getUserDetails(defaults.endpoint, token);
        const userEmail = await user_1.getUserEmail(defaults.endpoint, token);
        if (userEmail) {
            discoveredGitAuthor = `${userDetails.name} <${userEmail}>`;
        }
    }
    logger_1.logger.debug('Authenticated as GitHub user: ' + renovateUsername);
    const platformConfig = {
        endpoint: defaults.endpoint,
        gitAuthor: gitAuthor || discoveredGitAuthor,
        renovateUsername,
    };
    return platformConfig;
}
exports.initPlatform = initPlatform;
// Get all repositories that the user has access to
async function getRepos() {
    logger_1.logger.debug('Autodiscovering GitHub repositories');
    try {
        const res = await githubApi.getJson('user/repos?per_page=100', { paginate: true });
        return res.body.map((repo) => repo.full_name);
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.error({ err }, `GitHub getRepos error`);
        throw err;
    }
}
exports.getRepos = getRepos;
async function getBranchProtection(branchName) {
    // istanbul ignore if
    if (config.parentRepo) {
        return {};
    }
    const res = await githubApi.getJson(`repos/${config.repository}/branches/${escapeHash(branchName)}/protection`);
    return res.body;
}
let existingRepos;
// Initialize GitHub by getting base branch and SHA
async function initRepo({ endpoint, repository, forkMode, forkToken, localDir, includeForks, renovateUsername, optimizeForDisabled, }) {
    var _a, _b, _c;
    logger_1.logger.debug(`initRepo("${repository}")`);
    // config is used by the platform api itself, not necessary for the app layer to know
    config = { localDir, repository };
    // istanbul ignore if
    if (endpoint) {
        // Necessary for Renovate Pro - do not remove
        logger_1.logger.debug({ endpoint }, 'Overriding default GitHub endpoint');
        defaults.endpoint = endpoint;
        githubHttp.setBaseUrl(endpoint);
    }
    const opts = hostRules.find({
        hostType: platforms_1.PLATFORM_TYPE_GITHUB,
        url: defaults.endpoint,
    });
    config.isGhe = url_1.default.parse(defaults.endpoint).host !== 'api.github.com';
    config.renovateUsername = renovateUsername;
    [config.repositoryOwner, config.repositoryName] = repository.split('/');
    let repo;
    try {
        repo = await githubApi.queryRepo(`{
      repository(owner: "${config.repositoryOwner}", name: "${config.repositoryName}") {
        isFork
        isArchived
        nameWithOwner
        mergeCommitAllowed
        rebaseMergeAllowed
        squashMergeAllowed
        defaultBranchRef {
          name
          target {
            oid
          }
        }
      }
    }`);
        // istanbul ignore if
        if (!repo) {
            throw new Error(error_messages_1.REPOSITORY_NOT_FOUND);
        }
        // istanbul ignore if
        if (!((_a = repo.defaultBranchRef) === null || _a === void 0 ? void 0 : _a.name)) {
            throw new Error(error_messages_1.REPOSITORY_EMPTY);
        }
        // istanbul ignore if
        if (repo.isFork && !includeForks) {
            try {
                const renovateConfig = JSON.parse(Buffer.from((await githubApi.getJson(`repos/${config.repository}/contents/${defaultConfigFile}`)).body.content, 'base64').toString());
                if (!renovateConfig.includeForks) {
                    throw new Error();
                }
            }
            catch (err) {
                throw new Error(error_messages_1.REPOSITORY_FORKED);
            }
        }
        if (repo.nameWithOwner && repo.nameWithOwner !== repository) {
            logger_1.logger.debug({ repository, this_repository: repo.nameWithOwner }, 'Repository has been renamed');
            throw new Error(error_messages_1.REPOSITORY_RENAMED);
        }
        if (repo.isArchived) {
            logger_1.logger.debug('Repository is archived - throwing error to abort renovation');
            throw new Error(error_messages_1.REPOSITORY_ARCHIVED);
        }
        if (optimizeForDisabled) {
            let renovateConfig;
            try {
                renovateConfig = JSON.parse(Buffer.from((await githubApi.getJson(`repos/${config.repository}/contents/${defaultConfigFile}`)).body.content, 'base64').toString());
            }
            catch (err) {
                // Do nothing
            }
            if (renovateConfig && renovateConfig.enabled === false) {
                throw new Error(error_messages_1.REPOSITORY_DISABLED);
            }
        }
        // Use default branch as PR target unless later overridden.
        config.defaultBranch = repo.defaultBranchRef.name;
        config.defaultBranchSha = repo.defaultBranchRef.target.oid;
        // Base branch may be configured but defaultBranch is always fixed
        logger_1.logger.debug(`${repository} default branch = ${config.defaultBranch}`);
        // GitHub allows administrators to block certain types of merge, so we need to check it
        if (repo.rebaseMergeAllowed) {
            config.mergeMethod = 'rebase';
        }
        else if (repo.squashMergeAllowed) {
            config.mergeMethod = 'squash';
        }
        else if (repo.mergeCommitAllowed) {
            config.mergeMethod = 'merge';
        }
        else {
            // This happens if we don't have Administrator read access, it is not a critical error
            logger_1.logger.debug('Could not find allowed merge methods for repo');
        }
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.debug('Caught initRepo error');
        if (err.message === error_messages_1.REPOSITORY_ARCHIVED ||
            err.message === error_messages_1.REPOSITORY_RENAMED) {
            throw err;
        }
        if (err.statusCode === 403) {
            throw new Error(error_messages_1.REPOSITORY_ACCESS_FORBIDDEN);
        }
        if (err.statusCode === 404) {
            throw new Error(error_messages_1.REPOSITORY_NOT_FOUND);
        }
        if (err.message.startsWith('Repository access blocked')) {
            throw new Error(error_messages_1.REPOSITORY_BLOCKED);
        }
        if (err.message === error_messages_1.REPOSITORY_FORKED) {
            throw err;
        }
        if (err.message === error_messages_1.REPOSITORY_DISABLED) {
            throw err;
        }
        if (err.message === 'Response code 451 (Unavailable for Legal Reasons)') {
            throw new Error(error_messages_1.REPOSITORY_ACCESS_FORBIDDEN);
        }
        logger_1.logger.debug({ err }, 'Unknown GitHub initRepo error');
        throw err;
    }
    // This shouldn't be necessary, but occasional strange errors happened until it was added
    config.issueList = null;
    config.prList = null;
    config.openPrList = null;
    config.closedPrList = null;
    config.forkMode = !!forkMode;
    if (forkMode) {
        logger_1.logger.debug('Bot is in forkMode');
        config.forkToken = forkToken;
        // save parent name then delete
        config.parentRepo = config.repository;
        config.repository = null;
        // Get list of existing repos
        existingRepos =
            existingRepos ||
                (await githubApi.getJson('user/repos?per_page=100', {
                    token: forkToken || opts.token,
                    paginate: true,
                })).body.map((r) => r.full_name);
        try {
            config.repository = (await githubApi.postJson(`repos/${repository}/forks`, {
                token: forkToken || opts.token,
            })).body.full_name;
        }
        catch (err) /* istanbul ignore next */ {
            logger_1.logger.debug({ err }, 'Error forking repository');
            throw new Error(error_messages_1.REPOSITORY_CANNOT_FORK);
        }
        if (existingRepos.includes(config.repository)) {
            logger_1.logger.debug({ repository_fork: config.repository }, 'Found existing fork');
            // Need to update base branch
            logger_1.logger.debug({
                defaultBranch: config.defaultBranch,
                defaultBranchSha: config.defaultBranchSha,
            }, 'Setting defaultBranch ref in fork');
            // This is a lovely "hack" by GitHub that lets us force update our fork's master
            // with the base commit from the parent repository
            try {
                await githubApi.patchJson(`repos/${config.repository}/git/refs/heads/${config.defaultBranch}`, {
                    body: {
                        sha: config.defaultBranchSha,
                        force: true,
                    },
                    token: forkToken || opts.token,
                });
            }
            catch (err) /* istanbul ignore next */ {
                logger_1.logger.debug('Error updating fork reference - will try deleting fork to try again next time');
                try {
                    await githubApi.deleteJson(`repos/${config.repository}`, {
                        token: forkToken || opts.token,
                    });
                    logger_1.logger.info('Fork deleted');
                    if (is_1.default.nonEmptyArray(existingRepos)) {
                        existingRepos = existingRepos.filter((existingRepo) => existingRepo !== config.repository);
                    }
                }
                catch (deleteErr) {
                    logger_1.logger.warn({ err: deleteErr }, 'Could not delete fork');
                }
                if (err instanceof external_host_error_1.ExternalHostError) {
                    throw err;
                }
                throw new external_host_error_1.ExternalHostError(err);
            }
        }
        else {
            logger_1.logger.debug({ repository_fork: config.repository }, 'Created fork');
            existingRepos.push(config.repository);
            // Wait an arbitrary 30s to hopefully give GitHub enough time for forking to complete
            await delay_1.default(30000);
        }
    }
    const parsedEndpoint = url_1.default.parse(defaults.endpoint);
    // istanbul ignore else
    if (forkMode) {
        logger_1.logger.debug('Using forkToken for git init');
        parsedEndpoint.auth = config.forkToken;
    }
    else {
        logger_1.logger.debug('Using personal access token for git init');
        parsedEndpoint.auth = opts.token;
    }
    parsedEndpoint.host = parsedEndpoint.host.replace('api.github.com', 'github.com');
    parsedEndpoint.pathname = config.repository + '.git';
    const url = url_1.default.format(parsedEndpoint);
    await git.initRepo({
        ...config,
        url,
        gitAuthorName: (_b = global.gitAuthor) === null || _b === void 0 ? void 0 : _b.name,
        gitAuthorEmail: (_c = global.gitAuthor) === null || _c === void 0 ? void 0 : _c.email,
    });
    const repoConfig = {
        defaultBranch: config.defaultBranch,
        defaultBranchSha: config.defaultBranchSha,
        isFork: repo.isFork === true,
    };
    return repoConfig;
}
exports.initRepo = initRepo;
async function getRepoForceRebase() {
    if (config.repoForceRebase === undefined) {
        try {
            config.repoForceRebase = false;
            const branchProtection = await getBranchProtection(config.defaultBranch);
            logger_1.logger.debug('Found branch protection');
            if (branchProtection.required_pull_request_reviews) {
                logger_1.logger.debug('Branch protection: PR Reviews are required before merging');
                config.prReviewsRequired = true;
            }
            if (branchProtection.required_status_checks) {
                if (branchProtection.required_status_checks.strict) {
                    logger_1.logger.debug('Branch protection: PRs must be up-to-date before merging');
                    config.repoForceRebase = true;
                }
            }
            if (branchProtection.restrictions) {
                logger_1.logger.debug({
                    users: branchProtection.restrictions.users,
                    teams: branchProtection.restrictions.teams,
                }, 'Branch protection: Pushing to branch is restricted');
                config.pushProtection = true;
            }
        }
        catch (err) {
            if (err.statusCode === 404) {
                logger_1.logger.debug(`No branch protection found`);
            }
            else if (err.statusCode === 403) {
                logger_1.logger.debug('Branch protection: Do not have permissions to detect branch protection');
            }
            else {
                throw err;
            }
        }
    }
    return config.repoForceRebase;
}
exports.getRepoForceRebase = getRepoForceRebase;
// istanbul ignore next
async function setBaseBranch(branchName) {
    const baseBranchSha = await git.setBranch(branchName);
    return baseBranchSha;
}
exports.setBaseBranch = setBaseBranch;
// Branch
// istanbul ignore next
function deleteBranch(branchName, closePr) {
    return git.deleteBranch(branchName);
}
exports.deleteBranch = deleteBranch;
async function getClosedPrs() {
    if (!config.closedPrList) {
        config.closedPrList = {};
        let query;
        try {
            // prettier-ignore
            query = `
      query {
        repository(owner: "${config.repositoryOwner}", name: "${config.repositoryName}") {
          pullRequests(states: [CLOSED, MERGED], first: 100, orderBy: {field: UPDATED_AT, direction: DESC}) {
            nodes {
              number
              state
              headRefName
              title
              comments(last: 100) {
                nodes {
                  databaseId
                  body
                }
              }
            }
          }
        }
      }
      `;
            const nodes = await githubApi.queryRepoField(query, 'pullRequests', {
                paginate: false,
            });
            const prNumbers = [];
            // istanbul ignore if
            if (!(nodes === null || nodes === void 0 ? void 0 : nodes.length)) {
                logger_1.logger.debug({ query }, 'No graphql data, returning empty list');
                return {};
            }
            for (const pr of nodes) {
                // https://developer.github.com/v4/object/pullrequest/
                pr.displayNumber = `Pull Request #${pr.number}`;
                pr.state = pr.state.toLowerCase();
                pr.branchName = pr.headRefName;
                delete pr.headRefName;
                pr.comments = pr.comments.nodes.map((comment) => ({
                    id: comment.databaseId,
                    body: comment.body,
                }));
                pr.body = 'dummy body'; // just in case
                config.closedPrList[pr.number] = pr;
                prNumbers.push(pr.number);
            }
            prNumbers.sort();
            logger_1.logger.debug({ prNumbers }, 'Retrieved closed PR list with graphql');
        }
        catch (err) /* istanbul ignore next */ {
            logger_1.logger.warn({ query, err }, 'getClosedPrs error');
        }
    }
    return config.closedPrList;
}
async function getOpenPrs() {
    var _a, _b, _c, _d;
    // istanbul ignore if
    if (config.isGhe) {
        logger_1.logger.debug('Skipping unsupported graphql PullRequests.mergeStateStatus query on GHE');
        return {};
    }
    if (!config.openPrList) {
        config.openPrList = {};
        let query;
        try {
            // prettier-ignore
            query = `
      query {
        repository(owner: "${config.repositoryOwner}", name: "${config.repositoryName}") {
          pullRequests(states: [OPEN], first: 100, orderBy: {field: UPDATED_AT, direction: DESC}) {
            nodes {
              number
              headRefName
              baseRefName
              title
              mergeable
              mergeStateStatus
              labels(last: 100) {
                nodes {
                  name
                }
              }
              assignees {
                totalCount
              }
              reviewRequests {
                totalCount
              }
              commits(first: 2) {
                nodes {
                  commit {
                    author {
                      email
                    }
                    committer {
                      email
                    }
                    parents(last: 1) {
                      edges {
                        node {
                          abbreviatedOid
                          oid
                        }
                      }
                    }
                  }
                }
              }
              body
              reviews(first: 1, states:[CHANGES_REQUESTED]){
                nodes{
                  state
                }
              }
            }
          }
        }
      }
      `;
            const nodes = await githubApi.queryRepoField(query, 'pullRequests', {
                paginate: false,
                acceptHeader: 'application/vnd.github.merge-info-preview+json',
            });
            const prNumbers = [];
            // istanbul ignore if
            if (!(nodes === null || nodes === void 0 ? void 0 : nodes.length)) {
                logger_1.logger.debug({ query }, 'No graphql res.data');
                return {};
            }
            for (const pr of nodes) {
                // https://developer.github.com/v4/object/pullrequest/
                pr.displayNumber = `Pull Request #${pr.number}`;
                pr.state = pull_requests_1.PR_STATE_OPEN;
                pr.branchName = pr.headRefName;
                delete pr.headRefName;
                pr.targetBranch = pr.baseRefName;
                delete pr.baseRefName;
                // https://developer.github.com/v4/enum/mergeablestate
                const canMergeStates = ['BEHIND', 'CLEAN'];
                const hasNegativeReview = ((_b = (_a = pr.reviews) === null || _a === void 0 ? void 0 : _a.nodes) === null || _b === void 0 ? void 0 : _b.length) > 0;
                // istanbul ignore if
                if (hasNegativeReview) {
                    pr.canMerge = false;
                    pr.canMergeReason = `hasNegativeReview`;
                }
                else if (!canMergeStates.includes(pr.mergeStateStatus)) {
                    pr.canMerge = false;
                    pr.canMergeReason = `mergeStateStatus = ${pr.mergeStateStatus}`;
                }
                else {
                    pr.canMerge = true;
                }
                // https://developer.github.com/v4/enum/mergestatestatus
                if (pr.mergeStateStatus === 'DIRTY') {
                    pr.isConflicted = true;
                }
                else {
                    pr.isConflicted = false;
                }
                if (pr.labels) {
                    pr.labels = pr.labels.nodes.map((label) => label.name);
                }
                pr.hasAssignees = !!(((_c = pr.assignees) === null || _c === void 0 ? void 0 : _c.totalCount) > 0);
                delete pr.assignees;
                pr.hasReviewers = !!(((_d = pr.reviewRequests) === null || _d === void 0 ? void 0 : _d.totalCount) > 0);
                delete pr.reviewRequests;
                delete pr.mergeable;
                delete pr.mergeStateStatus;
                delete pr.commits;
                config.openPrList[pr.number] = pr;
                prNumbers.push(pr.number);
            }
            prNumbers.sort();
            logger_1.logger.trace({ prNumbers }, 'Retrieved open PR list with graphql');
        }
        catch (err) /* istanbul ignore next */ {
            logger_1.logger.warn({ query, err }, 'getOpenPrs error');
        }
    }
    return config.openPrList;
}
// Gets details for a PR
async function getPr(prNo) {
    if (!prNo) {
        return null;
    }
    const openPrs = await getOpenPrs();
    const openPr = openPrs[prNo];
    if (openPr) {
        logger_1.logger.debug('Returning from graphql open PR list');
        return openPr;
    }
    const closedPrs = await getClosedPrs();
    const closedPr = closedPrs[prNo];
    if (closedPr) {
        logger_1.logger.debug('Returning from graphql closed PR list');
        return closedPr;
    }
    logger_1.logger.debug({ prNo }, 'PR not found in open or closed PRs list - trying to fetch it directly');
    const pr = (await githubApi.getJson(`repos/${config.parentRepo || config.repository}/pulls/${prNo}`)).body;
    if (!pr) {
        return null;
    }
    // Harmonise PR values
    pr.displayNumber = `Pull Request #${pr.number}`;
    if (pr.state === pull_requests_1.PR_STATE_OPEN) {
        pr.branchName = pr.head ? pr.head.ref : undefined;
        pr.sha = pr.head ? pr.head.sha : undefined;
        if (pr.mergeable === true) {
            pr.canMerge = true;
        }
        else {
            pr.canMerge = false;
            pr.canMergeReason = `mergeable = ${pr.mergeable}`;
        }
        if (pr.mergeable_state === 'dirty') {
            logger_1.logger.debug({ prNo }, 'PR state is dirty so unmergeable');
            pr.isConflicted = true;
        }
    }
    return pr;
}
exports.getPr = getPr;
function matchesState(state, desiredState) {
    if (desiredState === pull_requests_1.PR_STATE_ALL) {
        return true;
    }
    if (desiredState.startsWith('!')) {
        return state !== desiredState.substring(1);
    }
    return state === desiredState;
}
async function getPrList() {
    logger_1.logger.trace('getPrList()');
    if (!config.prList) {
        logger_1.logger.debug('Retrieving PR list');
        let res;
        try {
            res = await githubApi.getJson(`repos/${config.parentRepo || config.repository}/pulls?per_page=100&state=all`, { paginate: true });
        }
        catch (err) /* istanbul ignore next */ {
            logger_1.logger.debug({ err }, 'getPrList err');
            throw new external_host_error_1.ExternalHostError(err, platforms_1.PLATFORM_TYPE_GITHUB);
        }
        config.prList = res.body.map((pr) => {
            var _a, _b, _c;
            return ({
                number: pr.number,
                branchName: pr.head.ref,
                sha: pr.head.sha,
                title: pr.title,
                state: pr.state === pull_requests_1.PR_STATE_CLOSED && ((_a = pr.merged_at) === null || _a === void 0 ? void 0 : _a.length)
                    ? /* istanbul ignore next */ 'merged'
                    : pr.state,
                createdAt: pr.created_at,
                closed_at: pr.closed_at,
                sourceRepo: (_c = (_b = pr.head) === null || _b === void 0 ? void 0 : _b.repo) === null || _c === void 0 ? void 0 : _c.full_name,
            });
        });
        logger_1.logger.debug(`Retrieved ${config.prList.length} Pull Requests`);
    }
    return config.prList;
}
exports.getPrList = getPrList;
async function findPr({ branchName, prTitle, state = pull_requests_1.PR_STATE_ALL, }) {
    logger_1.logger.debug(`findPr(${branchName}, ${prTitle}, ${state})`);
    const prList = await getPrList();
    const pr = prList.find((p) => p.branchName === branchName &&
        (!prTitle || p.title === prTitle) &&
        matchesState(p.state, state) &&
        (config.forkMode || config.repository === p.sourceRepo) // #5188
    );
    if (pr) {
        logger_1.logger.debug(`Found PR #${pr.number}`);
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
async function getStatus(branchName, useCache = true) {
    const commitStatusUrl = `repos/${config.repository}/commits/${escapeHash(branchName)}/status`;
    return (await githubApi.getJson(commitStatusUrl, { useCache })).body;
}
// Returns the combined status for a branch.
async function getBranchStatus(branchName, requiredStatusChecks) {
    var _a;
    logger_1.logger.debug(`getBranchStatus(${branchName})`);
    if (!requiredStatusChecks) {
        // null means disable status checks, so it always succeeds
        logger_1.logger.debug('Status checks disabled = returning "success"');
        return types_1.BranchStatus.green;
    }
    if (requiredStatusChecks.length) {
        // This is Unsupported
        logger_1.logger.warn({ requiredStatusChecks }, `Unsupported requiredStatusChecks`);
        return types_1.BranchStatus.red;
    }
    let commitStatus;
    try {
        commitStatus = await getStatus(branchName);
    }
    catch (err) /* istanbul ignore next */ {
        if (err.statusCode === 404) {
            logger_1.logger.debug('Received 404 when checking branch status, assuming that branch has been deleted');
            throw new Error(error_messages_1.REPOSITORY_CHANGED);
        }
        logger_1.logger.debug('Unknown error when checking branch status');
        throw err;
    }
    logger_1.logger.debug({ state: commitStatus.state, statuses: commitStatus.statuses }, 'branch status check result');
    let checkRuns = [];
    if (!config.isGhe) {
        try {
            const checkRunsUrl = `repos/${config.repository}/commits/${escapeHash(branchName)}/check-runs`;
            const opts = {
                headers: {
                    accept: 'application/vnd.github.antiope-preview+json',
                },
            };
            const checkRunsRaw = (await githubApi.getJson(checkRunsUrl, opts)).body;
            if ((_a = checkRunsRaw.check_runs) === null || _a === void 0 ? void 0 : _a.length) {
                checkRuns = checkRunsRaw.check_runs.map((run) => ({
                    name: run.name,
                    status: run.status,
                    conclusion: run.conclusion,
                }));
                logger_1.logger.debug({ checkRuns }, 'check runs result');
            }
            else {
                // istanbul ignore next
                logger_1.logger.debug({ result: checkRunsRaw }, 'No check runs found');
            }
        }
        catch (err) /* istanbul ignore next */ {
            if (err instanceof external_host_error_1.ExternalHostError) {
                throw err;
            }
            if (err.statusCode === 403 ||
                err.message === error_messages_1.PLATFORM_INTEGRATION_UNAUTHORIZED) {
                logger_1.logger.debug('No permission to view check runs');
            }
            else {
                logger_1.logger.warn({ err }, 'Error retrieving check runs');
            }
        }
    }
    if (checkRuns.length === 0) {
        if (commitStatus.state === 'success') {
            return types_1.BranchStatus.green;
        }
        if (commitStatus.state === 'failure') {
            return types_1.BranchStatus.red;
        }
        return types_1.BranchStatus.yellow;
    }
    if (commitStatus.state === 'failure' ||
        checkRuns.some((run) => run.conclusion === 'failure')) {
        return types_1.BranchStatus.red;
    }
    if ((commitStatus.state === 'success' || commitStatus.statuses.length === 0) &&
        checkRuns.every((run) => ['skipped', 'neutral', 'success'].includes(run.conclusion))) {
        return types_1.BranchStatus.green;
    }
    return types_1.BranchStatus.yellow;
}
exports.getBranchStatus = getBranchStatus;
async function getStatusCheck(branchName, useCache = true) {
    const branchCommit = await git.getBranchCommit(branchName);
    const url = `repos/${config.repository}/commits/${branchCommit}/statuses`;
    return (await githubApi.getJson(url, { useCache })).body;
}
const githubToRenovateStatusMapping = {
    success: types_1.BranchStatus.green,
    error: types_1.BranchStatus.red,
    failure: types_1.BranchStatus.red,
    pending: types_1.BranchStatus.yellow,
};
async function getBranchStatusCheck(branchName, context) {
    try {
        const res = await getStatusCheck(branchName);
        for (const check of res) {
            if (check.context === context) {
                return (githubToRenovateStatusMapping[check.state] || types_1.BranchStatus.yellow);
            }
        }
        return null;
    }
    catch (err) /* istanbul ignore next */ {
        if (err.statusCode === 404) {
            logger_1.logger.debug('Commit not found when checking statuses');
            throw new Error(error_messages_1.REPOSITORY_CHANGED);
        }
        throw err;
    }
}
exports.getBranchStatusCheck = getBranchStatusCheck;
async function setBranchStatus({ branchName, context, description, state, url: targetUrl, }) {
    // istanbul ignore if
    if (config.parentRepo) {
        logger_1.logger.debug('Cannot set branch status when in forking mode');
        return;
    }
    const existingStatus = await getBranchStatusCheck(branchName, context);
    if (existingStatus === state) {
        return;
    }
    logger_1.logger.debug({ branch: branchName, context, state }, 'Setting branch status');
    try {
        const branchCommit = await git.getBranchCommit(branchName);
        const url = `repos/${config.repository}/statuses/${branchCommit}`;
        const renovateToGitHubStateMapping = {
            green: 'success',
            yellow: 'pending',
            red: 'failure',
        };
        const options = {
            state: renovateToGitHubStateMapping[state],
            description,
            context,
        };
        if (targetUrl) {
            options.target_url = targetUrl;
        }
        await githubApi.postJson(url, { body: options });
        // update status cache
        await getStatus(branchName, false);
        await getStatusCheck(branchName, false);
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.debug({ err }, 'Caught error setting branch status - aborting');
        throw new Error(error_messages_1.REPOSITORY_CHANGED);
    }
}
exports.setBranchStatus = setBranchStatus;
// Issue
/* istanbul ignore next */
async function getIssues() {
    // prettier-ignore
    const query = `
    query {
      repository(owner: "${config.repositoryOwner}", name: "${config.repositoryName}") {
        issues(orderBy: {field: UPDATED_AT, direction: DESC}, filterBy: {createdBy: "${config.renovateUsername}"}) {
          pageInfo {
            endCursor
            hasNextPage
          }
          nodes {
            number
            state
            title
            body
          }
        }
      }
    }
  `;
    const result = await githubApi.queryRepoField(query, 'issues');
    logger_1.logger.debug(`Retrieved ${result.length} issues`);
    return result.map((issue) => ({
        ...issue,
        state: issue.state.toLowerCase(),
    }));
}
async function getIssueList() {
    if (!config.issueList) {
        logger_1.logger.debug('Retrieving issueList');
        config.issueList = await getIssues();
    }
    return config.issueList;
}
exports.getIssueList = getIssueList;
async function findIssue(title) {
    logger_1.logger.debug(`findIssue(${title})`);
    const [issue] = (await getIssueList()).filter((i) => i.state === 'open' && i.title === title);
    if (!issue) {
        return null;
    }
    logger_1.logger.debug('Found issue ' + issue.number);
    const issueBody = (await githubApi.getJson(`repos/${config.parentRepo || config.repository}/issues/${issue.number}`)).body.body;
    return {
        number: issue.number,
        body: issueBody,
    };
}
exports.findIssue = findIssue;
async function closeIssue(issueNumber) {
    logger_1.logger.debug(`closeIssue(${issueNumber})`);
    await githubApi.patchJson(`repos/${config.parentRepo || config.repository}/issues/${issueNumber}`, {
        body: { state: 'closed' },
    });
}
async function ensureIssue({ title, reuseTitle, body: rawBody, once = false, shouldReOpen = true, }) {
    var _a, _b;
    logger_1.logger.debug(`ensureIssue(${title})`);
    const body = sanitize_1.sanitize(rawBody);
    try {
        const issueList = await getIssueList();
        let issues = issueList.filter((i) => i.title === title);
        if (!issues.length) {
            issues = issueList.filter((i) => i.title === reuseTitle);
            if (issues.length) {
                logger_1.logger.debug({ reuseTitle, title }, 'Reusing issue title');
            }
        }
        if (issues.length) {
            let issue = issues.find((i) => i.state === 'open');
            if (!issue) {
                if (once) {
                    logger_1.logger.debug('Issue already closed - skipping recreation');
                    return null;
                }
                if (shouldReOpen) {
                    logger_1.logger.debug('Reopening previously closed issue');
                }
                issue = issues[issues.length - 1];
            }
            for (const i of issues) {
                if (i.state === 'open' && i.number !== issue.number) {
                    logger_1.logger.warn('Closing duplicate issue ' + i.number);
                    await closeIssue(i.number);
                }
            }
            const issueBody = (await githubApi.getJson(`repos/${config.parentRepo || config.repository}/issues/${issue.number}`)).body.body;
            if (issue.title === title &&
                issueBody === body &&
                issue.state === 'open') {
                logger_1.logger.debug('Issue is open and up to date - nothing to do');
                return null;
            }
            if (shouldReOpen) {
                logger_1.logger.debug('Patching issue');
                await githubApi.patchJson(`repos/${config.parentRepo || config.repository}/issues/${issue.number}`, {
                    body: { body, state: 'open', title },
                });
                logger_1.logger.debug('Issue updated');
                return 'updated';
            }
        }
        await githubApi.postJson(`repos/${config.parentRepo || config.repository}/issues`, {
            body: {
                title,
                body,
            },
        });
        logger_1.logger.info('Issue created');
        // reset issueList so that it will be fetched again as-needed
        delete config.issueList;
        return 'created';
    }
    catch (err) /* istanbul ignore next */ {
        if ((_b = (_a = err.body) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.startsWith('Issues are disabled for this repo')) {
            logger_1.logger.debug(`Issues are disabled, so could not create issue: ${err.message}`);
        }
        else {
            logger_1.logger.warn({ err }, 'Could not ensure issue');
        }
    }
    return null;
}
exports.ensureIssue = ensureIssue;
async function ensureIssueClosing(title) {
    logger_1.logger.debug(`ensureIssueClosing(${title})`);
    const issueList = await getIssueList();
    for (const issue of issueList) {
        if (issue.state === 'open' && issue.title === title) {
            await closeIssue(issue.number);
            logger_1.logger.debug({ number: issue.number }, 'Issue closed');
        }
    }
}
exports.ensureIssueClosing = ensureIssueClosing;
async function addAssignees(issueNo, assignees) {
    logger_1.logger.debug(`Adding assignees ${assignees} to #${issueNo}`);
    const repository = config.parentRepo || config.repository;
    await githubApi.postJson(`repos/${repository}/issues/${issueNo}/assignees`, {
        body: {
            assignees,
        },
    });
}
exports.addAssignees = addAssignees;
async function addReviewers(prNo, reviewers) {
    logger_1.logger.debug(`Adding reviewers ${reviewers} to #${prNo}`);
    const userReviewers = reviewers.filter((e) => !e.startsWith('team:'));
    const teamReviewers = reviewers
        .filter((e) => e.startsWith('team:'))
        .map((e) => e.replace(/^team:/, ''));
    try {
        await githubApi.postJson(`repos/${config.parentRepo || config.repository}/pulls/${prNo}/requested_reviewers`, {
            body: {
                reviewers: userReviewers,
                team_reviewers: teamReviewers,
            },
        });
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.warn({ err }, 'Failed to assign reviewer');
    }
}
exports.addReviewers = addReviewers;
async function addLabels(issueNo, labels) {
    logger_1.logger.debug(`Adding labels ${labels} to #${issueNo}`);
    const repository = config.parentRepo || config.repository;
    if (is_1.default.array(labels) && labels.length) {
        await githubApi.postJson(`repos/${repository}/issues/${issueNo}/labels`, {
            body: labels,
        });
    }
}
async function deleteLabel(issueNo, label) {
    logger_1.logger.debug(`Deleting label ${label} from #${issueNo}`);
    const repository = config.parentRepo || config.repository;
    try {
        await githubApi.deleteJson(`repos/${repository}/issues/${issueNo}/labels/${label}`);
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.warn({ err, issueNo, label }, 'Failed to delete label');
    }
}
exports.deleteLabel = deleteLabel;
async function addComment(issueNo, body) {
    // POST /repos/:owner/:repo/issues/:number/comments
    await githubApi.postJson(`repos/${config.parentRepo || config.repository}/issues/${issueNo}/comments`, {
        body: { body },
    });
}
async function editComment(commentId, body) {
    // PATCH /repos/:owner/:repo/issues/comments/:id
    await githubApi.patchJson(`repos/${config.parentRepo || config.repository}/issues/comments/${commentId}`, {
        body: { body },
    });
}
async function deleteComment(commentId) {
    // DELETE /repos/:owner/:repo/issues/comments/:id
    await githubApi.deleteJson(`repos/${config.parentRepo || config.repository}/issues/comments/${commentId}`);
}
async function getComments(issueNo) {
    const pr = (await getClosedPrs())[issueNo];
    if (pr) {
        logger_1.logger.debug('Returning closed PR list comments');
        return pr.comments;
    }
    // GET /repos/:owner/:repo/issues/:number/comments
    logger_1.logger.debug(`Getting comments for #${issueNo}`);
    const url = `repos/${config.parentRepo || config.repository}/issues/${issueNo}/comments?per_page=100`;
    try {
        const comments = (await githubApi.getJson(url, {
            paginate: true,
        })).body;
        logger_1.logger.debug(`Found ${comments.length} comments`);
        return comments;
    }
    catch (err) /* istanbul ignore next */ {
        if (err.statusCode === 404) {
            logger_1.logger.debug('404 respose when retrieving comments');
            throw new external_host_error_1.ExternalHostError(err, platforms_1.PLATFORM_TYPE_GITHUB);
        }
        throw err;
    }
}
async function ensureComment({ number, topic, content, }) {
    var _a, _b;
    const sanitizedContent = sanitize_1.sanitize(content);
    try {
        const comments = await getComments(number);
        let body;
        let commentId = null;
        let commentNeedsUpdating = false;
        if (topic) {
            logger_1.logger.debug(`Ensuring comment "${topic}" in #${number}`);
            body = `### ${topic}\n\n${sanitizedContent}`;
            comments.forEach((comment) => {
                if (comment.body.startsWith(`### ${topic}\n\n`)) {
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
            logger_1.logger.info({ repository: config.repository, issueNo: number, topic }, 'Comment added');
        }
        else if (commentNeedsUpdating) {
            await editComment(commentId, body);
            logger_1.logger.debug({ repository: config.repository, issueNo: number }, 'Comment updated');
        }
        else {
            logger_1.logger.debug('Comment is already update-to-date');
        }
        return true;
    }
    catch (err) /* istanbul ignore next */ {
        if (err instanceof external_host_error_1.ExternalHostError) {
            throw err;
        }
        if ((_b = (_a = err.body) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.includes('is locked')) {
            logger_1.logger.debug('Issue is locked - cannot add comment');
        }
        else {
            logger_1.logger.warn({ err }, 'Error ensuring comment');
        }
        return false;
    }
}
exports.ensureComment = ensureComment;
async function ensureCommentRemoval({ number: issueNo, topic, content, }) {
    var _a, _b;
    logger_1.logger.trace(`Ensuring comment "${topic || content}" in #${issueNo} is removed`);
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
    try {
        if (commentId) {
            logger_1.logger.debug({ issueNo }, 'Removing comment');
            await deleteComment(commentId);
        }
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.warn({ err }, 'Error deleting comment');
    }
}
exports.ensureCommentRemoval = ensureCommentRemoval;
// Pull Request
// Creates PR and returns PR number
async function createPr({ branchName, targetBranch, prTitle: title, prBody: rawBody, labels, platformOptions = {}, draftPR = false, }) {
    const body = sanitize_1.sanitize(rawBody);
    const base = targetBranch;
    // Include the repository owner to handle forkMode and regular mode
    const head = `${config.repository.split('/')[0]}:${branchName}`;
    const options = {
        body: {
            title,
            head,
            base,
            body,
            draft: draftPR,
        },
    };
    // istanbul ignore if
    if (config.forkToken) {
        options.token = config.forkToken;
        options.body.maintainer_can_modify = true;
    }
    logger_1.logger.debug({ title, head, base, draft: draftPR }, 'Creating PR');
    const pr = (await githubApi.postJson(`repos/${config.parentRepo || config.repository}/pulls`, options)).body;
    logger_1.logger.debug({ branch: branchName, pr: pr.number, draft: draftPR }, 'PR created');
    // istanbul ignore if
    if (config.prList) {
        config.prList.push(pr);
    }
    pr.displayNumber = `Pull Request #${pr.number}`;
    pr.branchName = branchName;
    await addLabels(pr.number, labels);
    if (platformOptions.statusCheckVerify) {
        logger_1.logger.debug('Setting statusCheckVerify');
        await setBranchStatus({
            branchName,
            context: `renovate/verify`,
            description: `Renovate verified pull request`,
            state: types_1.BranchStatus.green,
            url: 'https://github.com/renovatebot/renovate',
        });
    }
    return pr;
}
exports.createPr = createPr;
async function updatePr(prNo, title, rawBody) {
    logger_1.logger.debug(`updatePr(${prNo}, ${title}, body)`);
    const body = sanitize_1.sanitize(rawBody);
    const patchBody = { title };
    if (body) {
        patchBody.body = body;
    }
    const options = {
        body: patchBody,
    };
    // istanbul ignore if
    if (config.forkToken) {
        options.token = config.forkToken;
    }
    try {
        await githubApi.patchJson(`repos/${config.parentRepo || config.repository}/pulls/${prNo}`, options);
        logger_1.logger.debug({ pr: prNo }, 'PR updated');
    }
    catch (err) /* istanbul ignore next */ {
        if (err instanceof external_host_error_1.ExternalHostError) {
            throw err;
        }
        logger_1.logger.warn({ err }, 'Error updating PR');
    }
}
exports.updatePr = updatePr;
async function mergePr(prNo, branchName) {
    logger_1.logger.debug(`mergePr(${prNo}, ${branchName})`);
    // istanbul ignore if
    if (config.prReviewsRequired) {
        logger_1.logger.debug({ branch: branchName, prNo }, 'Branch protection: Attempting to merge PR when PR reviews are enabled');
        const repository = config.parentRepo || config.repository;
        const reviews = await githubApi.getJson(`repos/${repository}/pulls/${prNo}/reviews`);
        const isApproved = reviews.body.some((review) => review.state === 'APPROVED');
        if (!isApproved) {
            logger_1.logger.debug({ branch: branchName, prNo }, 'Branch protection: Cannot automerge PR until there is an approving review');
            return false;
        }
        logger_1.logger.debug('Found approving reviews');
    }
    const url = `repos/${config.parentRepo || config.repository}/pulls/${prNo}/merge`;
    const options = {
        body: {},
    };
    let automerged = false;
    if (config.mergeMethod) {
        // This path is taken if we have auto-detected the allowed merge types from the repo
        options.body.merge_method = config.mergeMethod;
        try {
            logger_1.logger.debug({ options, url }, `mergePr`);
            await githubApi.putJson(url, options);
            automerged = true;
        }
        catch (err) {
            if (err.statusCode === 404 || err.statusCode === 405) {
                // istanbul ignore next
                logger_1.logger.debug({ response: err.response ? err.response.body : undefined }, 'GitHub blocking PR merge -- will keep trying');
            }
            else {
                logger_1.logger.warn({ err }, `Failed to ${options.body.merge_method} merge PR`);
                return false;
            }
        }
    }
    if (!automerged) {
        // We need to guess the merge method and try squash -> rebase -> merge
        options.body.merge_method = 'rebase';
        try {
            logger_1.logger.debug({ options, url }, `mergePr`);
            await githubApi.putJson(url, options);
        }
        catch (err1) {
            logger_1.logger.debug({ err: err1 }, `Failed to ${options.body.merge_method} merge PR`);
            try {
                options.body.merge_method = 'squash';
                logger_1.logger.debug({ options, url }, `mergePr`);
                await githubApi.putJson(url, options);
            }
            catch (err2) {
                logger_1.logger.debug({ err: err2 }, `Failed to ${options.body.merge_method} merge PR`);
                try {
                    options.body.merge_method = 'merge';
                    logger_1.logger.debug({ options, url }, `mergePr`);
                    await githubApi.putJson(url, options);
                }
                catch (err3) {
                    logger_1.logger.debug({ err: err3 }, `Failed to ${options.body.merge_method} merge PR`);
                    logger_1.logger.debug({ pr: prNo }, 'All merge attempts failed');
                    return false;
                }
            }
        }
    }
    logger_1.logger.debug({ pr: prNo }, 'PR merged');
    // Delete branch
    await deleteBranch(branchName);
    return true;
}
exports.mergePr = mergePr;
function getPrBody(input) {
    if (config.isGhe) {
        return pr_body_1.smartTruncate(input, 60000);
    }
    const massagedInput = input
        // to be safe, replace all github.com links with renovatebot redirector
        .replace(/href="https?:\/\/github.com\//g, 'href="https://togithub.com/')
        .replace(/]\(https:\/\/github\.com\//g, '](https://togithub.com/')
        .replace(/]: https:\/\/github\.com\//g, ']: https://togithub.com/');
    return pr_body_1.smartTruncate(massagedInput, 60000);
}
exports.getPrBody = getPrBody;
async function getVulnerabilityAlerts() {
    // prettier-ignore
    const query = `
  query {
    repository(owner:"${config.repositoryOwner}", name:"${config.repositoryName}") {
      vulnerabilityAlerts(last: 100) {
        edges {
          node {
            dismissReason
            vulnerableManifestFilename
            vulnerableManifestPath
            vulnerableRequirements
            securityAdvisory {
              description
              identifiers { type value }
              references { url }
              severity
            }
            securityVulnerability {
              package { name ecosystem }
              firstPatchedVersion { identifier }
              vulnerableVersionRange
            }
          }
        }
      }
    }
  }`;
    let alerts = [];
    try {
        const vulnerabilityAlerts = await githubApi.queryRepoField(query, 'vulnerabilityAlerts', {
            paginate: false,
            acceptHeader: 'application/vnd.github.vixen-preview+json',
        });
        if (vulnerabilityAlerts === null || vulnerabilityAlerts === void 0 ? void 0 : vulnerabilityAlerts.length) {
            alerts = vulnerabilityAlerts.map((edge) => edge.node);
            if (alerts.length) {
                logger_1.logger.debug({ alerts }, 'Found GitHub vulnerability alerts');
            }
        }
        else {
            logger_1.logger.debug('Cannot read vulnerability alerts');
        }
    }
    catch (err) {
        logger_1.logger.debug({ err }, 'Error retrieving vulnerability alerts');
    }
    return alerts;
}
exports.getVulnerabilityAlerts = getVulnerabilityAlerts;
//# sourceMappingURL=index.js.map