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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMergeMethod = exports.getProjectAndRepo = exports.getCommitDetails = exports.getRenovatePRFormat = exports.max4000Chars = exports.getFile = exports.getAzureBranchObj = exports.getRefs = exports.getBranchNameWithoutRefsheadsPrefix = exports.getNewBranchName = exports.getStorageExtraCloneOpts = void 0;
const GitInterfaces_1 = require("azure-devops-node-api/interfaces/GitInterfaces");
const pull_requests_1 = require("../../constants/pull-requests");
const logger_1 = require("../../logger");
const azureApi = __importStar(require("./azure-got-wrapper"));
const mergePolicyGuid = 'fa4e907d-c16b-4a4c-9dfa-4916e5d171ab'; // Magic GUID for merge strategy policy configurations
function toBase64(from) {
    return Buffer.from(from).toString('base64');
}
function getStorageExtraCloneOpts(config) {
    let header;
    const headerName = 'AUTHORIZATION';
    if (!config.token && config.username && config.password) {
        header = `${headerName}: basic ${toBase64(`${config.username}:${config.password}`)}`;
    }
    else if (config.token.length !== 52) {
        header = `${headerName}: bearer ${config.token}`;
    }
    else {
        header = `${headerName}: basic ${toBase64(`:${config.token}`)}`;
    }
    return { '--config': `http.extraheader=${header}` };
}
exports.getStorageExtraCloneOpts = getStorageExtraCloneOpts;
function getNewBranchName(branchName) {
    if (branchName && !branchName.startsWith('refs/heads/')) {
        return `refs/heads/${branchName}`;
    }
    return branchName;
}
exports.getNewBranchName = getNewBranchName;
function getBranchNameWithoutRefsheadsPrefix(branchPath) {
    if (!branchPath) {
        logger_1.logger.error(`getBranchNameWithoutRefsheadsPrefix(${branchPath})`);
        return undefined;
    }
    if (!branchPath.startsWith('refs/heads/')) {
        logger_1.logger.trace(`The refs/heads/ name should have started with 'refs/heads/' but it didn't. (${branchPath})`);
        return branchPath;
    }
    return branchPath.substring(11, branchPath.length);
}
exports.getBranchNameWithoutRefsheadsPrefix = getBranchNameWithoutRefsheadsPrefix;
function getBranchNameWithoutRefsPrefix(branchPath) {
    if (!branchPath) {
        logger_1.logger.error(`getBranchNameWithoutRefsPrefix(${branchPath})`);
        return undefined;
    }
    if (!branchPath.startsWith('refs/')) {
        logger_1.logger.trace(`The ref name should have started with 'refs/' but it didn't. (${branchPath})`);
        return branchPath;
    }
    return branchPath.substring(5, branchPath.length);
}
async function getRefs(repoId, branchName) {
    logger_1.logger.debug(`getRefs(${repoId}, ${branchName})`);
    const azureApiGit = await azureApi.gitApi();
    const refs = await azureApiGit.getRefs(repoId, undefined, getBranchNameWithoutRefsPrefix(branchName));
    return refs;
}
exports.getRefs = getRefs;
async function getAzureBranchObj(repoId, branchName, from) {
    const fromBranchName = getNewBranchName(from);
    const refs = await getRefs(repoId, fromBranchName);
    if (refs.length === 0) {
        logger_1.logger.debug(`getAzureBranchObj without a valid from, so initial commit.`);
        return {
            name: getNewBranchName(branchName),
            oldObjectId: '0000000000000000000000000000000000000000',
        };
    }
    return {
        name: getNewBranchName(branchName),
        oldObjectId: refs[0].objectId,
    };
}
exports.getAzureBranchObj = getAzureBranchObj;
async function streamToString(stream) {
    const chunks = [];
    /* eslint-disable promise/avoid-new */
    const p = await new Promise((resolve) => {
        stream.on('data', (chunk) => {
            chunks.push(chunk.toString());
        });
        stream.on('end', () => {
            resolve(chunks.join(''));
        });
    });
    return p;
}
// if no branchName, look globaly
async function getFile(repoId, filePath, branchName) {
    logger_1.logger.trace(`getFile(filePath=${filePath}, branchName=${branchName})`);
    const azureApiGit = await azureApi.gitApi();
    const item = await azureApiGit.getItemText(repoId, filePath, undefined, undefined, 0, // because we look for 1 file
    false, false, true, {
        versionType: 0,
        versionOptions: 0,
        version: getBranchNameWithoutRefsheadsPrefix(branchName),
    });
    if (item === null || item === void 0 ? void 0 : item.readable) {
        const fileContent = await streamToString(item);
        try {
            const jTmp = JSON.parse(fileContent);
            if (jTmp.typeKey === 'GitItemNotFoundException') {
                // file not found
                return null;
            }
            if (jTmp.typeKey === 'GitUnresolvableToCommitException') {
                // branch not found
                return null;
            }
        }
        catch (error) {
            // it 's not a JSON, so I send the content directly with the line under
        }
        return fileContent;
    }
    return null; // no file found
}
exports.getFile = getFile;
function max4000Chars(str) {
    if (str && str.length >= 4000) {
        return str.substring(0, 3999);
    }
    return str;
}
exports.max4000Chars = max4000Chars;
function getRenovatePRFormat(azurePr) {
    var _a;
    const pr = azurePr;
    pr.displayNumber = `Pull Request #${azurePr.pullRequestId}`;
    pr.number = azurePr.pullRequestId;
    pr.body = azurePr.description;
    pr.targetBranch = getBranchNameWithoutRefsheadsPrefix(azurePr.targetRefName);
    pr.branchName = pr.targetBranch;
    pr.createdAt = (_a = azurePr.creationDate) === null || _a === void 0 ? void 0 : _a.toISOString();
    // status
    // export declare enum PullRequestStatus {
    //   NotSet = 0,
    //   Active = 1,
    //   Abandoned = 2,
    //   Completed = 3,
    //   All = 4,
    // }
    if (azurePr.status === 2) {
        pr.state = pull_requests_1.PR_STATE_CLOSED;
    }
    else if (azurePr.status === 3) {
        pr.state = pull_requests_1.PR_STATE_MERGED;
    }
    else {
        pr.state = pull_requests_1.PR_STATE_OPEN;
    }
    // mergeStatus
    // export declare enum PullRequestAsyncStatus {
    //   NotSet = 0,
    //   Queued = 1,
    //   Conflicts = 2,
    //   Succeeded = 3,
    //   RejectedByPolicy = 4,
    //   Failure = 5,
    // }
    if (azurePr.mergeStatus === 2) {
        pr.isConflicted = true;
    }
    return pr;
}
exports.getRenovatePRFormat = getRenovatePRFormat;
async function getCommitDetails(commit, repoId) {
    logger_1.logger.debug(`getCommitDetails(${commit}, ${repoId})`);
    const azureApiGit = await azureApi.gitApi();
    const results = await azureApiGit.getCommit(commit, repoId);
    return results;
}
exports.getCommitDetails = getCommitDetails;
function getProjectAndRepo(str) {
    logger_1.logger.trace(`getProjectAndRepo(${str})`);
    const strSplited = str.split(`/`);
    if (strSplited.length === 1) {
        return {
            project: str,
            repo: str,
        };
    }
    if (strSplited.length === 2) {
        return {
            project: strSplited[0],
            repo: strSplited[1],
        };
    }
    const msg = `${str} can be only structured this way : 'repository' or 'projectName/repository'!`;
    logger_1.logger.error(msg);
    throw new Error(msg);
}
exports.getProjectAndRepo = getProjectAndRepo;
async function getMergeMethod(repoId, project) {
    const policyConfigurations = (await (await azureApi.policyApi()).getPolicyConfigurations(project))
        .filter((p) => p.settings.scope.some((s) => s.repositoryId === repoId) &&
        p.type.id === mergePolicyGuid)
        .map((p) => p.settings)[0];
    try {
        return Object.keys(policyConfigurations)
            .map((p) => GitInterfaces_1.GitPullRequestMergeStrategy[p.slice(5)])
            .find((p) => p);
    }
    catch (err) {
        return GitInterfaces_1.GitPullRequestMergeStrategy.NoFastForward;
    }
}
exports.getMergeMethod = getMergeMethod;
//# sourceMappingURL=azure-helper.js.map