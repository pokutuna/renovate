"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renovateRepository = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const logger_1 = require("../../logger");
const fs_1 = require("../../util/fs");
const split_1 = require("../../util/split");
const dependency_dashboard_1 = require("./dependency-dashboard");
const error_1 = __importDefault(require("./error"));
const finalise_1 = require("./finalise");
const init_1 = require("./init");
const pr_1 = require("./onboarding/pr");
const process_1 = require("./process");
const result_1 = require("./result");
const stats_1 = require("./stats");
let renovateVersion = 'unknown';
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    renovateVersion = require('../../../package.json').version; // eslint-disable-line global-require
}
catch (err) /* istanbul ignore next */ {
    logger_1.logger.debug({ err }, 'Error getting renovate version');
}
// istanbul ignore next
async function renovateRepository(repoConfig) {
    split_1.splitInit();
    let config = { ...repoConfig };
    logger_1.setMeta({ repository: config.repository });
    logger_1.logger.info({ renovateVersion }, 'Repository started');
    logger_1.logger.trace({ config });
    let repoResult;
    try {
        await fs_extra_1.default.ensureDir(config.localDir);
        logger_1.logger.debug('Using localDir: ' + config.localDir);
        config = await init_1.initRepo(config);
        split_1.addSplit('init');
        const { branches, branchList, packageFiles } = await process_1.extractDependencies(config);
        await pr_1.ensureOnboardingPr(config, packageFiles, branches);
        const res = await process_1.updateRepo(config, branches, branchList);
        split_1.addSplit('update');
        if (res !== 'automerged') {
            await dependency_dashboard_1.ensureMasterIssue(config, branches);
        }
        await finalise_1.finaliseRepo(config, branchList);
        repoResult = result_1.processResult(config, res);
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.setMeta({ repository: config.repository });
        const errorRes = await error_1.default(config, err);
        repoResult = result_1.processResult(config, errorRes);
    }
    if (config.localDir && !config.persistRepoData) {
        await fs_1.deleteLocalFile('.');
    }
    const splits = split_1.getSplits();
    logger_1.logger.debug(splits, 'Repository timing splits (milliseconds)');
    stats_1.printRequestStats();
    logger_1.logger.info({ durationMs: splits.total }, 'Repository finished');
    return repoResult;
}
exports.renovateRepository = renovateRepository;
//# sourceMappingURL=index.js.map