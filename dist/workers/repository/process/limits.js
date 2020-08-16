"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrsRemaining = exports.getConcurrentPrsRemaining = exports.getPrHourlyRemaining = void 0;
const moment_1 = __importDefault(require("moment"));
const logger_1 = require("../../../logger");
const platform_1 = require("../../../platform");
const git_1 = require("../../../util/git");
async function getPrHourlyRemaining(config) {
    if (config.prHourlyLimit) {
        logger_1.logger.debug('Calculating hourly PRs remaining');
        const prList = await platform_1.platform.getPrList();
        const currentHourStart = moment_1.default({
            hour: moment_1.default().hour(),
        });
        logger_1.logger.debug('currentHourStart=' + currentHourStart);
        try {
            const soFarThisHour = prList.filter((pr) => pr.branchName !== config.onboardingBranch &&
                moment_1.default(pr.createdAt).isAfter(currentHourStart));
            const prsRemaining = config.prHourlyLimit - soFarThisHour.length;
            logger_1.logger.debug(`PR hourly limit remaining: ${prsRemaining}`);
            // istanbul ignore if
            if (prsRemaining <= 0) {
                logger_1.logger.debug({
                    prs: prsRemaining,
                }, 'Creation of new PRs is blocked by existing PRs');
            }
            return prsRemaining;
        }
        catch (err) {
            logger_1.logger.error('Error checking PRs created per hour');
        }
    }
    return 99;
}
exports.getPrHourlyRemaining = getPrHourlyRemaining;
async function getConcurrentPrsRemaining(config, branches) {
    if (config.prConcurrentLimit) {
        logger_1.logger.debug(`Enforcing prConcurrentLimit (${config.prConcurrentLimit})`);
        let currentlyOpen = 0;
        for (const branch of branches) {
            if (await git_1.branchExists(branch.branchName)) {
                currentlyOpen += 1;
            }
        }
        logger_1.logger.debug(`${currentlyOpen} PRs are currently open`);
        const concurrentRemaining = config.prConcurrentLimit - currentlyOpen;
        logger_1.logger.debug(`PR concurrent limit remaining: ${concurrentRemaining}`);
        return concurrentRemaining;
    }
    return 99;
}
exports.getConcurrentPrsRemaining = getConcurrentPrsRemaining;
async function getPrsRemaining(config, branches) {
    const hourlyRemaining = await getPrHourlyRemaining(config);
    const concurrentRemaining = await getConcurrentPrsRemaining(config, branches);
    return hourlyRemaining < concurrentRemaining
        ? hourlyRemaining
        : concurrentRemaining;
}
exports.getPrsRemaining = getPrsRemaining;
//# sourceMappingURL=limits.js.map