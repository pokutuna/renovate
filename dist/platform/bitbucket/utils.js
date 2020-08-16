"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prInfo = exports.isConflicted = exports.accumulateValues = exports.buildStates = exports.prStates = exports.repoInfoTransformer = void 0;
const url_1 = __importDefault(require("url"));
const pull_requests_1 = require("../../constants/pull-requests");
const bitbucket_1 = require("../../util/http/bitbucket");
const bitbucketHttp = new bitbucket_1.BitbucketHttp();
function repoInfoTransformer(repoInfoBody) {
    return {
        isFork: !!repoInfoBody.parent,
        owner: repoInfoBody.owner.username,
        mainbranch: repoInfoBody.mainbranch.name,
        mergeMethod: 'merge',
        has_issues: repoInfoBody.has_issues,
    };
}
exports.repoInfoTransformer = repoInfoTransformer;
exports.prStates = {
    open: ['OPEN'],
    notOpen: ['MERGED', 'DECLINED', 'SUPERSEDED'],
    merged: ['MERGED'],
    closed: ['DECLINED', 'SUPERSEDED'],
    all: ['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED'],
};
exports.buildStates = {
    green: 'SUCCESSFUL',
    red: 'FAILED',
    yellow: 'INPROGRESS',
};
const addMaxLength = (inputUrl, pagelen = 100) => {
    const { search, ...parsedUrl } = url_1.default.parse(inputUrl, true); // eslint-disable-line @typescript-eslint/no-unused-vars
    const maxedUrl = url_1.default.format({
        ...parsedUrl,
        query: { ...parsedUrl.query, pagelen },
    });
    return maxedUrl;
};
function callApi(apiUrl, method, options) {
    /* istanbul ignore next */
    switch (method.toLowerCase()) {
        case 'post':
            return bitbucketHttp.postJson(apiUrl, options);
        case 'put':
            return bitbucketHttp.putJson(apiUrl, options);
        case 'patch':
            return bitbucketHttp.patchJson(apiUrl, options);
        case 'head':
            return bitbucketHttp.headJson(apiUrl, options);
        case 'delete':
            return bitbucketHttp.deleteJson(apiUrl, options);
        case 'get':
        default:
            return bitbucketHttp.getJson(apiUrl, options);
    }
}
async function accumulateValues(reqUrl, method = 'get', options, pagelen) {
    let accumulator = [];
    let nextUrl = addMaxLength(reqUrl, pagelen);
    while (typeof nextUrl !== 'undefined') {
        const { body } = await callApi(nextUrl, method, options);
        accumulator = [...accumulator, ...body.values];
        nextUrl = body.next;
    }
    return accumulator;
}
exports.accumulateValues = accumulateValues;
function isConflicted(files) {
    for (const file of files) {
        for (const chunk of file.chunks) {
            for (const change of chunk.changes) {
                if (change.content === '+=======') {
                    return true;
                }
            }
        }
    }
    return false;
}
exports.isConflicted = isConflicted;
function prInfo(pr) {
    return {
        number: pr.id,
        body: pr.summary ? pr.summary.raw : /* istanbul ignore next */ undefined,
        branchName: pr.source.branch.name,
        targetBranch: pr.destination.branch.name,
        title: pr.title,
        state: exports.prStates.closed.includes(pr.state)
            ? /* istanbul ignore next */ pull_requests_1.PR_STATE_CLOSED
            : pr.state.toLowerCase(),
        createdAt: pr.created_on,
    };
}
exports.prInfo = prInfo;
//# sourceMappingURL=utils.js.map