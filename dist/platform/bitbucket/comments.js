"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureCommentRemoval = exports.ensureComment = void 0;
const logger_1 = require("../../logger");
const bitbucket_1 = require("../../util/http/bitbucket");
const utils_1 = require("./utils");
const bitbucketHttp = new bitbucket_1.BitbucketHttp();
async function getComments(config, prNo) {
    const comments = await utils_1.accumulateValues(`/2.0/repositories/${config.repository}/pullrequests/${prNo}/comments`);
    logger_1.logger.debug(`Found ${comments.length} comments`);
    return comments;
}
async function addComment(config, prNo, raw) {
    await bitbucketHttp.postJson(`/2.0/repositories/${config.repository}/pullrequests/${prNo}/comments`, {
        body: { content: { raw } },
    });
}
async function editComment(config, prNo, commentId, raw) {
    await bitbucketHttp.putJson(`/2.0/repositories/${config.repository}/pullrequests/${prNo}/comments/${commentId}`, {
        body: { content: { raw } },
    });
}
async function deleteComment(config, prNo, commentId) {
    await bitbucketHttp.deleteJson(`/2.0/repositories/${config.repository}/pullrequests/${prNo}/comments/${commentId}`);
}
async function ensureComment({ config, number: prNo, topic, content, }) {
    try {
        const comments = await getComments(config, prNo);
        let body;
        let commentId;
        let commentNeedsUpdating;
        if (topic) {
            logger_1.logger.debug(`Ensuring comment "${topic}" in #${prNo}`);
            body = `### ${topic}\n\n${content}`;
            comments.forEach((comment) => {
                if (comment.content.raw.startsWith(`### ${topic}\n\n`)) {
                    commentId = comment.id;
                    commentNeedsUpdating = comment.content.raw !== body;
                }
            });
        }
        else {
            logger_1.logger.debug(`Ensuring content-only comment in #${prNo}`);
            body = `${content}`;
            comments.forEach((comment) => {
                if (comment.content.raw === body) {
                    commentId = comment.id;
                    commentNeedsUpdating = false;
                }
            });
        }
        if (!commentId) {
            await addComment(config, prNo, body);
            logger_1.logger.info({ repository: config.repository, prNo, topic }, 'Comment added');
        }
        else if (commentNeedsUpdating) {
            await editComment(config, prNo, commentId, body);
            logger_1.logger.debug({ repository: config.repository, prNo }, 'Comment updated');
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
async function ensureCommentRemoval(config, prNo, topic, content) {
    var _a, _b;
    try {
        logger_1.logger.debug(`Ensuring comment "${topic || content}" in #${prNo} is removed`);
        const comments = await getComments(config, prNo);
        const byTopic = (comment) => comment.content.raw.startsWith(`### ${topic}\n\n`);
        const byContent = (comment) => comment.content.raw.trim() === content;
        let commentId = null;
        if (topic) {
            commentId = (_a = comments.find(byTopic)) === null || _a === void 0 ? void 0 : _a.id;
        }
        else if (content) {
            commentId = (_b = comments.find(byContent)) === null || _b === void 0 ? void 0 : _b.id;
        }
        if (commentId) {
            await deleteComment(config, prNo, commentId);
        }
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.warn({ err }, 'Error ensuring comment removal');
    }
}
exports.ensureCommentRemoval = ensureCommentRemoval;
//# sourceMappingURL=comments.js.map