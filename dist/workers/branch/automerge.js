"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryBranchAutomerge = void 0;
const logger_1 = require("../../logger");
const platform_1 = require("../../platform");
const types_1 = require("../../types");
const git_1 = require("../../util/git");
async function tryBranchAutomerge(config) {
    logger_1.logger.debug('Checking if we can automerge branch');
    if (!(config.automerge && config.automergeType === 'branch')) {
        return 'no automerge';
    }
    const existingPr = await platform_1.platform.getBranchPr(config.branchName);
    if (existingPr) {
        return 'automerge aborted - PR exists';
    }
    const branchStatus = await platform_1.platform.getBranchStatus(config.branchName, config.requiredStatusChecks);
    if (branchStatus === types_1.BranchStatus.green) {
        logger_1.logger.debug(`Automerging branch`);
        try {
            if (config.dryRun) {
                logger_1.logger.info('DRY-RUN: Would automerge branch' + config.branchName);
            }
            else {
                await git_1.mergeBranch(config.branchName);
            }
            logger_1.logger.info({ branch: config.branchName }, 'Branch automerged');
            return 'automerged'; // Branch no longer exists
        }
        catch (err) {
            // istanbul ignore if
            if (err.message === 'not ready') {
                logger_1.logger.debug('Branch is not ready for automerge');
                return 'not ready';
            }
            logger_1.logger.info({ err }, `Failed to automerge branch`);
            return 'failed';
        }
    }
    else if (branchStatus === types_1.BranchStatus.red) {
        return 'branch status error';
    }
    else {
        logger_1.logger.debug(`Branch status is "${branchStatus}" - skipping automerge`);
    }
    return 'no automerge';
}
exports.tryBranchAutomerge = tryBranchAutomerge;
//# sourceMappingURL=automerge.js.map