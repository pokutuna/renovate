"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeUpdates = void 0;
const logger_1 = require("../../../logger");
const branch_1 = require("../../branch");
const limits_1 = require("../../global/limits");
const limits_2 = require("./limits");
async function writeUpdates(config, allBranches) {
    let branches = allBranches;
    logger_1.logger.debug(`Processing ${branches.length} branch${branches.length !== 1 ? 'es' : ''}: ${branches
        .map((b) => b.branchName)
        .sort()
        .join(', ')}`);
    branches = branches.filter((branchConfig) => {
        if (branchConfig.blockedByPin) {
            logger_1.logger.debug(`Branch ${branchConfig.branchName} is blocked by a Pin PR`);
            return false;
        }
        return true;
    });
    let prsRemaining = await limits_2.getPrsRemaining(config, branches);
    logger_1.logger.debug({ prsRemaining }, 'Calculated maximum PRs remaining this run');
    for (const branch of branches) {
        logger_1.addMeta({ branch: branch.branchName });
        const prLimitReached = prsRemaining <= 0;
        const commitLimitReached = limits_1.getLimitRemaining('prCommitsPerRunLimit') <= 0;
        const res = await branch_1.processBranch(branch, prLimitReached, commitLimitReached);
        branch.res = res;
        if (res === 'automerged' && branch.automergeType !== 'pr-comment') {
            // Stop procesing other branches because base branch has been changed
            return res;
        }
        let deductPrRemainingCount = 0;
        if (res === 'pr-created') {
            deductPrRemainingCount = 1;
        }
        // istanbul ignore if
        if (res === 'automerged' &&
            branch.automergeType === 'pr-comment' &&
            branch.requiredStatusChecks === null) {
            deductPrRemainingCount = 1;
        }
        prsRemaining -= deductPrRemainingCount;
    }
    logger_1.removeMeta(['branch']);
    return 'done';
}
exports.writeUpdates = writeUpdates;
//# sourceMappingURL=write.js.map