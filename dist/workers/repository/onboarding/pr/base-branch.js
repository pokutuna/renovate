"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBaseBranchDesc = void 0;
function getBaseBranchDesc(config) {
    var _a;
    // Describe base branch only if it's configured
    if (!((_a = config.baseBranches) === null || _a === void 0 ? void 0 : _a.length)) {
        return '';
    }
    if (config.baseBranches.length > 1) {
        return `You have configured Renovate to use the following baseBranches: ${config.baseBranches
            .map((branch) => `\`${branch}\``)
            .join(', ')}.`;
    }
    return `You have configured Renovate to use branch \`${config.baseBranches[0]}\` as base branch.\n\n`;
}
exports.getBaseBranchDesc = getBaseBranchDesc;
//# sourceMappingURL=base-branch.js.map