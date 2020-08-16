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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterConfig = exports.parseConfigs = exports.getManagerConfig = exports.mergeChildConfig = void 0;
const logger_1 = require("../logger");
const manager_1 = require("../manager");
const url_1 = require("../util/url");
const cliParser = __importStar(require("./cli"));
const defaultsParser = __importStar(require("./defaults"));
const definitions = __importStar(require("./definitions"));
const envParser = __importStar(require("./env"));
const fileParser = __importStar(require("./file"));
const presets_1 = require("./presets");
const utils_1 = require("./utils");
Object.defineProperty(exports, "mergeChildConfig", { enumerable: true, get: function () { return utils_1.mergeChildConfig; } });
__exportStar(require("./common"), exports);
function getManagerConfig(config, manager) {
    let managerConfig = {
        ...config,
        language: null,
        manager: null,
    };
    const language = manager_1.get(manager, 'language');
    if (language) {
        managerConfig = utils_1.mergeChildConfig(managerConfig, config[language]);
    }
    managerConfig = utils_1.mergeChildConfig(managerConfig, config[manager]);
    for (const i of manager_1.getLanguageList().concat(manager_1.getManagerList())) {
        delete managerConfig[i];
    }
    managerConfig.language = language;
    managerConfig.manager = manager;
    return managerConfig;
}
exports.getManagerConfig = getManagerConfig;
async function parseConfigs(env, argv) {
    logger_1.logger.debug('Parsing configs');
    // Get configs
    const defaultConfig = await presets_1.resolveConfigPresets(defaultsParser.getConfig());
    const fileConfig = await presets_1.resolveConfigPresets(fileParser.getConfig(env));
    const cliConfig = await presets_1.resolveConfigPresets(cliParser.getConfig(argv));
    const envConfig = await presets_1.resolveConfigPresets(envParser.getConfig(env));
    let config = utils_1.mergeChildConfig(fileConfig, envConfig);
    config = utils_1.mergeChildConfig(config, cliConfig);
    const combinedConfig = config;
    config = utils_1.mergeChildConfig(defaultConfig, config);
    if (config.prFooter !== defaultConfig.prFooter) {
        config.customPrFooter = true;
    }
    if (config.forceCli) {
        config = utils_1.mergeChildConfig(config, { force: { ...cliConfig } });
    }
    // Set log level
    logger_1.levels('stdout', config.logLevel);
    if (config.logContext) {
        // This only has an effect if logContext was defined via file or CLI, otherwise it would already have been detected in env
        logger_1.setContext(config.logContext);
    }
    // Add file logger
    // istanbul ignore if
    if (config.logFile) {
        logger_1.logger.debug(`Enabling ${config.logFileLevel} logging to ${config.logFile}`);
        logger_1.addStream({
            name: 'logfile',
            path: config.logFile,
            level: config.logFileLevel,
        });
    }
    logger_1.logger.trace({ config: defaultConfig }, 'Default config');
    logger_1.logger.debug({ config: fileConfig }, 'File config');
    logger_1.logger.debug({ config: cliConfig }, 'CLI config');
    logger_1.logger.debug({ config: envConfig }, 'Env config');
    logger_1.logger.debug({ config: combinedConfig }, 'Combined config');
    // Get global config
    logger_1.logger.trace({ config }, 'Full config');
    // Print config
    logger_1.logger.trace({ config }, 'Global config');
    // Massage endpoint to have a trailing slash
    if (config.endpoint) {
        logger_1.logger.debug('Adding trailing slash to endpoint');
        config.endpoint = url_1.ensureTrailingSlash(config.endpoint);
    }
    // Remove log file entries
    delete config.logFile;
    delete config.logFileLevel;
    // Move global variables that we need to use later
    global.trustLevel =
        config.trustLevel || /* istanbul ignore next: never happen? */ 'low';
    delete config.trustLevel;
    return config;
}
exports.parseConfigs = parseConfigs;
function filterConfig(inputConfig, targetStage) {
    logger_1.logger.trace({ config: inputConfig }, `filterConfig('${targetStage}')`);
    const outputConfig = { ...inputConfig };
    const stages = ['global', 'repository', 'package', 'branch', 'pr'];
    const targetIndex = stages.indexOf(targetStage);
    for (const option of definitions.getOptions()) {
        const optionIndex = stages.indexOf(option.stage);
        if (optionIndex !== -1 && optionIndex < targetIndex) {
            delete outputConfig[option.name];
        }
    }
    return outputConfig;
}
exports.filterConfig = filterConfig;
//# sourceMappingURL=index.js.map