"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBaseBranch = void 0;
const logger_1 = require("../../../logger");
const platform_1 = require("../../../platform");
const git_1 = require("../../../util/git");
async function checkBaseBranch(config) {
    logger_1.logger.debug('checkBaseBranch()');
    logger_1.logger.debug(`config.repoIsOnboarded=${config.repoIsOnboarded}`);
    let error = [];
    let baseBranchSha;
    // Read content and target PRs here
    if (await git_1.branchExists(config.baseBranch)) {
        baseBranchSha = await platform_1.platform.setBaseBranch(config.baseBranch);
    }
    else {
        // Warn and ignore setting (use default branch)
        const message = `The configured baseBranch "${config.baseBranch}" is not present. Ignoring`;
        error = [
            {
                depName: 'baseBranch',
                message,
            },
        ];
        logger_1.logger.warn(message);
    }
    return { ...config, errors: config.errors.concat(error), baseBranchSha };
}
exports.checkBaseBranch = checkBaseBranch;
//# sourceMappingURL=base.js.map