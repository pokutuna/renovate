"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prAlreadyExisted = void 0;
const error_messages_1 = require("../../constants/error-messages");
const pull_requests_1 = require("../../constants/pull-requests");
const logger_1 = require("../../logger");
const platform_1 = require("../../platform");
/** TODO: Proper return type */
async function prAlreadyExisted(config) {
    logger_1.logger.trace({ config }, 'prAlreadyExisted');
    if (config.recreateClosed) {
        logger_1.logger.debug('recreateClosed is true');
        return null;
    }
    logger_1.logger.debug('recreateClosed is false');
    // Return if same PR already existed
    const pr = await platform_1.platform.findPr({
        branchName: config.branchName,
        prTitle: config.prTitle,
        state: pull_requests_1.PR_STATE_NOT_OPEN,
    });
    if (pr) {
        logger_1.logger.debug('Found closed PR with current title');
        const prDetails = await platform_1.platform.getPr(pr.number);
        // istanbul ignore if
        if (prDetails.state === pull_requests_1.PR_STATE_OPEN) {
            logger_1.logger.debug('PR reopened');
            throw new Error(error_messages_1.REPOSITORY_CHANGED);
        }
        return pr;
    }
    logger_1.logger.debug('prAlreadyExisted=false');
    return null;
}
exports.prAlreadyExisted = prAlreadyExisted;
//# sourceMappingURL=check-existing.js.map