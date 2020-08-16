"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = void 0;
const path_1 = __importDefault(require("path"));
const logger_1 = require("../logger");
const migration_1 = require("./migration");
function getConfig(env) {
    let configFile = env.RENOVATE_CONFIG_FILE || 'config';
    if (!path_1.default.isAbsolute(configFile)) {
        configFile = `${process.cwd()}/${configFile}`;
        logger_1.logger.debug('Checking for config file in ' + configFile);
    }
    let config = {};
    try {
        // eslint-disable-next-line global-require,import/no-dynamic-require
        config = require(configFile);
    }
    catch (err) {
        // istanbul ignore if
        if (err instanceof SyntaxError) {
            logger_1.logger.fatal(`Could not parse config file \n ${err.stack}`);
            process.exit(1);
        }
        // Do nothing
        logger_1.logger.debug('No config file found on disk - skipping');
    }
    const { isMigrated, migratedConfig } = migration_1.migrateConfig(config);
    if (isMigrated) {
        logger_1.logger.warn({ originalConfig: config, migratedConfig }, 'Config needs migrating');
        config = migratedConfig;
    }
    return config;
}
exports.getConfig = getConfig;
//# sourceMappingURL=file.js.map