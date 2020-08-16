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
exports.migrateAndValidate = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const logger_1 = require("../logger");
const configMassage = __importStar(require("./massage"));
const configMigration = __importStar(require("./migration"));
const configValidation = __importStar(require("./validation"));
async function migrateAndValidate(config, input) {
    logger_1.logger.debug('migrateAndValidate()');
    try {
        const { isMigrated, migratedConfig } = configMigration.migrateConfig(input);
        if (isMigrated) {
            logger_1.logger.debug({ oldConfig: input, newConfig: migratedConfig }, 'Config migration necessary');
        }
        else {
            logger_1.logger.debug('No config migration necessary');
        }
        const massagedConfig = configMassage.massageConfig(migratedConfig);
        logger_1.logger.debug({ config: massagedConfig }, 'massaged config');
        const { warnings, errors, } = await configValidation.validateConfig(massagedConfig);
        // istanbul ignore if
        if (is_1.default.nonEmptyArray(warnings)) {
            logger_1.logger.info({ warnings }, 'Found renovate config warnings');
        }
        if (is_1.default.nonEmptyArray(errors)) {
            logger_1.logger.info({ errors }, 'Found renovate config errors');
        }
        massagedConfig.errors = (config.errors || []).concat(errors);
        if (!config.repoIsOnboarded) {
            // TODO #556 - enable warnings in real PRs
            massagedConfig.warnings = (config.warnings || []).concat(warnings);
        }
        return massagedConfig;
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.debug({ config: input }, 'migrateAndValidate error');
        throw err;
    }
}
exports.migrateAndValidate = migrateAndValidate;
//# sourceMappingURL=migrate-validate.js.map