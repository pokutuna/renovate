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
exports.getUserEmail = exports.getUserDetails = void 0;
const logger_1 = require("../../logger");
const githubHttp = __importStar(require("../../util/http/github"));
const githubApi = new githubHttp.GithubHttp();
let userDetails;
async function getUserDetails(endpoint, token) {
    if (userDetails) {
        return userDetails;
    }
    try {
        const userData = (await githubApi.getJson(endpoint + 'user', {
            token,
        })).body;
        userDetails = {
            username: userData.login,
            name: userData.name,
        };
        return userDetails;
    }
    catch (err) {
        logger_1.logger.debug({ err }, 'Error authenticating with GitHub');
        throw new Error('Init: Authentication failure');
    }
}
exports.getUserDetails = getUserDetails;
let userEmail;
async function getUserEmail(endpoint, token) {
    try {
        const emails = (await githubApi.getJson(endpoint + 'user/emails', {
            token,
        })).body;
        userEmail = (emails === null || emails === void 0 ? void 0 : emails[0].email) || null;
        return userEmail;
    }
    catch (err) {
        logger_1.logger.debug('Cannot read user/emails endpoint on GitHub to retrieve gitAuthor');
        return null;
    }
}
exports.getUserEmail = getUserEmail;
//# sourceMappingURL=user.js.map