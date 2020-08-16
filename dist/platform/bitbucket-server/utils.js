"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.accumulateValues = exports.prInfo = void 0;
// SEE for the reference https://github.com/renovatebot/renovate/blob/c3e9e572b225085448d94aa121c7ec81c14d3955/lib/platform/bitbucket/utils.js
const url_1 = __importDefault(require("url"));
const pull_requests_1 = require("../../constants/pull-requests");
const bitbucket_server_1 = require("../../util/http/bitbucket-server");
const bitbucketServerHttp = new bitbucket_server_1.BitbucketServerHttp();
// https://docs.atlassian.com/bitbucket-server/rest/6.0.0/bitbucket-rest.html#idp250
const prStateMapping = {
    MERGED: pull_requests_1.PR_STATE_MERGED,
    DECLINED: pull_requests_1.PR_STATE_CLOSED,
    OPEN: pull_requests_1.PR_STATE_OPEN,
};
function prInfo(pr) {
    return {
        version: pr.version,
        number: pr.id,
        body: pr.description,
        branchName: pr.fromRef.displayId,
        targetBranch: pr.toRef.displayId,
        title: pr.title,
        state: prStateMapping[pr.state],
        createdAt: pr.createdDate,
    };
}
exports.prInfo = prInfo;
const addMaxLength = (inputUrl, limit = 100) => {
    const { search, ...parsedUrl } = url_1.default.parse(inputUrl, true); // eslint-disable-line @typescript-eslint/no-unused-vars
    const maxedUrl = url_1.default.format({
        ...parsedUrl,
        query: { ...parsedUrl.query, limit },
    });
    return maxedUrl;
};
function callApi(apiUrl, method, options) {
    /* istanbul ignore next */
    switch (method.toLowerCase()) {
        case 'post':
            return bitbucketServerHttp.postJson(apiUrl, options);
        case 'put':
            return bitbucketServerHttp.putJson(apiUrl, options);
        case 'patch':
            return bitbucketServerHttp.patchJson(apiUrl, options);
        case 'head':
            return bitbucketServerHttp.headJson(apiUrl, options);
        case 'delete':
            return bitbucketServerHttp.deleteJson(apiUrl, options);
        case 'get':
        default:
            return bitbucketServerHttp.getJson(apiUrl, options);
    }
}
async function accumulateValues(reqUrl, method = 'get', options, limit) {
    let accumulator = [];
    let nextUrl = addMaxLength(reqUrl, limit);
    while (typeof nextUrl !== 'undefined') {
        // TODO: fix typing
        const { body } = await callApi(nextUrl, method, options);
        accumulator = [...accumulator, ...body.values];
        if (body.isLastPage !== false) {
            break;
        }
        const { search, ...parsedUrl } = url_1.default.parse(nextUrl, true); // eslint-disable-line @typescript-eslint/no-unused-vars
        nextUrl = url_1.default.format({
            ...parsedUrl,
            query: {
                ...parsedUrl.query,
                start: body.nextPageStart,
            },
        });
    }
    return accumulator;
}
exports.accumulateValues = accumulateValues;
//# sourceMappingURL=utils.js.map