"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autodiscoverRepositories = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const minimatch_1 = __importDefault(require("minimatch"));
const logger_1 = require("../../logger");
const platform_1 = require("../../platform");
// istanbul ignore next
function repoName(value) {
    return String(is_1.default.string(value) ? value : value.repository).toLowerCase();
}
async function autodiscoverRepositories(config) {
    var _a, _b;
    if (!config.autodiscover) {
        if (!((_a = config.repositories) === null || _a === void 0 ? void 0 : _a.length)) {
            logger_1.logger.warn('No repositories found - did you want to run with flag --autodiscover?');
        }
        return config;
    }
    // Autodiscover list of repositories
    let discovered = await platform_1.platform.getRepos();
    if (!(discovered === null || discovered === void 0 ? void 0 : discovered.length)) {
        // Soft fail (no error thrown) if no accessible repositories
        logger_1.logger.debug('The account associated with your token does not have access to any repos');
        return config;
    }
    if (config.autodiscoverFilter) {
        discovered = discovered.filter(minimatch_1.default.filter(config.autodiscoverFilter));
        if (!discovered.length) {
            // Soft fail (no error thrown) if no accessible repositories match the filter
            logger_1.logger.debug('None of the discovered repositories matched the filter');
            return config;
        }
    }
    logger_1.logger.info({ length: discovered.length, repositories: discovered }, `Autodiscovered repositories`);
    // istanbul ignore if
    if ((_b = config.repositories) === null || _b === void 0 ? void 0 : _b.length) {
        logger_1.logger.debug('Checking autodiscovered repositories against configured repositories');
        for (const configuredRepo of config.repositories) {
            const repository = repoName(configuredRepo);
            let found = false;
            for (let i = discovered.length - 1; i > -1; i -= 1) {
                if (repository === repoName(discovered[i])) {
                    found = true;
                    logger_1.logger.debug({ repository }, 'Using configured repository settings');
                    // TODO: fix typings
                    discovered[i] = configuredRepo;
                }
            }
            if (!found) {
                logger_1.logger.warn({ repository }, 'Configured repository is in not in autodiscover list');
            }
        }
    }
    return { ...config, repositories: discovered };
}
exports.autodiscoverRepositories = autodiscoverRepositories;
//# sourceMappingURL=autodiscover.js.map