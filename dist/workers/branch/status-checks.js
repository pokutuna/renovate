"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUnpublishable = exports.setStability = void 0;
const logger_1 = require("../../logger");
const platform_1 = require("../../platform");
const types_1 = require("../../types");
async function setStatusCheck(branchName, context, description, state, url) {
    const existingState = await platform_1.platform.getBranchStatusCheck(branchName, context);
    // Check if state needs setting
    if (existingState === state) {
        logger_1.logger.debug(`Status check ${context} is already up-to-date`);
    }
    else {
        logger_1.logger.debug(`Updating ${context} status check state to ${state}`);
        await platform_1.platform.setBranchStatus({
            branchName,
            context,
            description,
            state,
            url,
        });
    }
}
async function setStability(config) {
    if (!config.stabilityStatus) {
        return;
    }
    const context = `renovate/stability-days`;
    const description = config.stabilityStatus === types_1.BranchStatus.green
        ? 'Updates have met stability days requirement'
        : 'Updates have not met stability days requirement';
    await setStatusCheck(config.branchName, context, description, config.stabilityStatus, config.productLinks.documentation);
}
exports.setStability = setStability;
async function setUnpublishable(config) {
    if (!config.unpublishSafe) {
        return;
    }
    const context = `renovate/unpublish-safe`;
    // Set canBeUnpublished status check
    const state = config.canBeUnpublished
        ? types_1.BranchStatus.yellow
        : types_1.BranchStatus.green;
    const description = config.canBeUnpublished
        ? 'Packages < 24 hours old can be unpublished'
        : 'Packages cannot be unpublished';
    await setStatusCheck(config.branchName, context, description, state, config.productLinks.docs);
}
exports.setUnpublishable = setUnpublishable;
//# sourceMappingURL=status-checks.js.map