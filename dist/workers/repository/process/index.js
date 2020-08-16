"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRepo = exports.extractDependencies = void 0;
const config_1 = require("../../../config");
const logger_1 = require("../../../logger");
const platform_1 = require("../../../platform");
const split_1 = require("../../../util/split");
const extract_update_1 = require("./extract-update");
async function setBaseBranch(baseBranch, config) {
    logger_1.logger.debug(`baseBranch: ${baseBranch}`);
    const baseBranchConfig = config_1.mergeChildConfig(config, { baseBranch });
    if (config.baseBranches.length > 1) {
        baseBranchConfig.branchPrefix += `${baseBranch}-`;
        baseBranchConfig.hasBaseBranches = true;
    }
    baseBranchConfig.baseBranchSha = await platform_1.platform.setBaseBranch(baseBranch);
    return baseBranchConfig;
}
async function extractDependencies(config) {
    var _a;
    logger_1.logger.debug('processRepo()');
    /* eslint-disable no-param-reassign */
    config.dependencyDashboardChecks = {};
    // istanbul ignore next
    if (config.dependencyDashboard ||
        config.dependencyDashboardApproval ||
        config.prCreation === 'approval' ||
        (config.packageRules &&
            config.packageRules.some((rule) => rule.dependencyDashboardApproval || rule.prCreation === 'approval'))) {
        config.dependencyDashboardTitle =
            config.dependencyDashboardTitle || `Dependency Dashboard`;
        const issue = await platform_1.platform.findIssue(config.dependencyDashboardTitle);
        if (issue) {
            const checkMatch = ' - \\[x\\] <!-- ([a-zA-Z]+)-branch=([^\\s]+) -->';
            const checked = issue.body.match(new RegExp(checkMatch, 'g'));
            if (checked === null || checked === void 0 ? void 0 : checked.length) {
                const re = new RegExp(checkMatch);
                checked.forEach((check) => {
                    const [, type, branchName] = re.exec(check);
                    config.dependencyDashboardChecks[branchName] = type;
                });
            }
            const checkedRebaseAll = issue.body.includes(' - [x] <!-- rebase-all-open-prs -->');
            if (checkedRebaseAll) {
                config.dependencyDashboardRebaseAllOpen = true;
                /* eslint-enable no-param-reassign */
            }
        }
    }
    let res = {
        branches: [],
        branchList: [],
        packageFiles: null,
    };
    if ((_a = config.baseBranches) === null || _a === void 0 ? void 0 : _a.length) {
        logger_1.logger.debug({ baseBranches: config.baseBranches }, 'baseBranches');
        const extracted = {};
        for (const baseBranch of config.baseBranches) {
            const baseBranchConfig = await setBaseBranch(baseBranch, config);
            extracted[baseBranch] = await extract_update_1.extract(baseBranchConfig);
        }
        split_1.addSplit('extract');
        for (const baseBranch of config.baseBranches) {
            const baseBranchConfig = await setBaseBranch(baseBranch, config);
            const packageFiles = extracted[baseBranch];
            const baseBranchRes = await extract_update_1.lookup(baseBranchConfig, packageFiles);
            res.branches = res.branches.concat(baseBranchRes === null || baseBranchRes === void 0 ? void 0 : baseBranchRes.branches);
            res.branchList = res.branchList.concat(baseBranchRes === null || baseBranchRes === void 0 ? void 0 : baseBranchRes.branchList);
            res.packageFiles = res.packageFiles || (baseBranchRes === null || baseBranchRes === void 0 ? void 0 : baseBranchRes.packageFiles); // Use the first branch
        }
    }
    else {
        logger_1.logger.debug('No baseBranches');
        const packageFiles = await extract_update_1.extract(config);
        split_1.addSplit('extract');
        res = await extract_update_1.lookup(config, packageFiles);
    }
    split_1.addSplit('lookup');
    return res;
}
exports.extractDependencies = extractDependencies;
function updateRepo(config, branches, branchList) {
    logger_1.logger.debug('processRepo()');
    return extract_update_1.update(config, branches);
}
exports.updateRepo = updateRepo;
//# sourceMappingURL=index.js.map