"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = exports.getRepositoryConfig = void 0;
const path_1 = __importDefault(require("path"));
const is_1 = __importDefault(require("@sindresorhus/is"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const configParser = __importStar(require("../../config"));
const logger_1 = require("../../logger");
const util_1 = require("../../util");
const hostRules = __importStar(require("../../util/host-rules"));
const repositoryWorker = __importStar(require("../repository"));
const autodiscover_1 = require("./autodiscover");
const initialize_1 = require("./initialize");
const limits = __importStar(require("./limits"));
async function getRepositoryConfig(globalConfig, repository) {
    const repoConfig = configParser.mergeChildConfig(globalConfig, is_1.default.string(repository) ? { repository } : repository);
    repoConfig.localDir = path_1.default.join(repoConfig.baseDir, `./repos/${repoConfig.platform}/${repoConfig.repository}`);
    await fs_extra_1.default.ensureDir(repoConfig.localDir);
    delete repoConfig.baseDir;
    return configParser.filterConfig(repoConfig, 'repository');
}
exports.getRepositoryConfig = getRepositoryConfig;
function getGlobalConfig() {
    return configParser.parseConfigs(process.env, process.argv);
}
function haveReachedLimits() {
    if (limits.getLimitRemaining('prCommitsPerRunLimit') <= 0) {
        logger_1.logger.info('Max commits created for this run.');
        return true;
    }
    return false;
}
async function start() {
    let config;
    try {
        // read global config from file, env and cli args
        config = await getGlobalConfig();
        // initialize all submodules
        config = await initialize_1.globalInitialize(config);
        // autodiscover repositories (needs to come after platform initialization)
        config = await autodiscover_1.autodiscoverRepositories(config);
        // Iterate through repositories sequentially
        for (const repository of config.repositories) {
            if (haveReachedLimits()) {
                break;
            }
            const repoConfig = await getRepositoryConfig(config, repository);
            await util_1.setUtilConfig(repoConfig);
            if (repoConfig.hostRules) {
                hostRules.clear();
                repoConfig.hostRules.forEach((rule) => hostRules.add(rule));
                repoConfig.hostRules = [];
            }
            await repositoryWorker.renovateRepository(repoConfig);
            logger_1.setMeta({});
        }
    }
    catch (err) /* istanbul ignore next */ {
        if (err.message.startsWith('Init: ')) {
            logger_1.logger.fatal(err.message.substring(6));
        }
        else {
            logger_1.logger.fatal({ err }, `Fatal error: ${err.message}`);
        }
    }
    finally {
        initialize_1.globalFinalize(config);
        logger_1.logger.debug(`Renovate exiting`);
    }
    const loggerErrors = logger_1.getErrors();
    /* istanbul ignore if */
    if (loggerErrors.length) {
        logger_1.logger.info({ loggerErrors }, 'Renovate is exiting with a non-zero code due to the following logged errors');
        return 1;
    }
    return 0;
}
exports.start = start;
//# sourceMappingURL=index.js.map