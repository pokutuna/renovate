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
exports.mergeRenovateConfig = void 0;
const path_1 = __importDefault(require("path"));
const json_dup_key_validator_1 = __importDefault(require("json-dup-key-validator"));
const json5_1 = __importDefault(require("json5"));
const config_1 = require("../../../config");
const app_strings_1 = require("../../../config/app-strings");
const decrypt_1 = require("../../../config/decrypt");
const migrate_validate_1 = require("../../../config/migrate-validate");
const presets = __importStar(require("../../../config/presets"));
const error_messages_1 = require("../../../constants/error-messages");
const npmApi = __importStar(require("../../../datasource/npm"));
const logger_1 = require("../../../logger");
const external_host_error_1 = require("../../../types/errors/external-host-error");
const repository_1 = require("../../../util/cache/repository");
const clone_1 = require("../../../util/clone");
const fs_1 = require("../../../util/fs");
const git_1 = require("../../../util/git");
const hostRules = __importStar(require("../../../util/host-rules"));
const flatten_1 = require("./flatten");
// Check for repository config
async function mergeRenovateConfig(config) {
    var _a;
    let returnConfig = { ...config };
    const fileList = await git_1.getFileList();
    async function detectConfigFile() {
        for (const fileName of app_strings_1.configFileNames) {
            if (fileName === 'package.json') {
                try {
                    const pJson = JSON.parse(await fs_1.readLocalFile('package.json', 'utf8'));
                    if (pJson.renovate) {
                        logger_1.logger.debug('Using package.json for global renovate config');
                        return 'package.json';
                    }
                }
                catch (err) {
                    // Do nothing
                }
            }
            else if (fileList.includes(fileName)) {
                return fileName;
            }
        }
        return null;
    }
    const configFile = await detectConfigFile();
    if (!configFile) {
        logger_1.logger.debug('No renovate config file found');
        return returnConfig;
    }
    logger_1.logger.debug(`Found ${configFile} config file`);
    let renovateJson;
    if (configFile === 'package.json') {
        // We already know it parses
        renovateJson = JSON.parse(await fs_1.readLocalFile('package.json', 'utf8'))
            .renovate;
        logger_1.logger.debug({ config: renovateJson }, 'package.json>renovate config');
    }
    else {
        let renovateConfig = await fs_1.readLocalFile(configFile, 'utf8');
        // istanbul ignore if
        if (renovateConfig === null) {
            logger_1.logger.warn('Fetching renovate config returns null');
            throw new external_host_error_1.ExternalHostError(Error('Fetching renovate config returns null'), config.platform);
        }
        // istanbul ignore if
        if (!renovateConfig.length) {
            renovateConfig = '{}';
        }
        const fileType = path_1.default.extname(configFile);
        if (fileType === '.json5') {
            try {
                renovateJson = json5_1.default.parse(renovateConfig);
            }
            catch (err) /* istanbul ignore next */ {
                logger_1.logger.debug({ renovateConfig }, 'Error parsing renovate config renovate.json5');
                const error = new Error(error_messages_1.CONFIG_VALIDATION);
                error.configFile = configFile;
                error.validationError = 'Invalid JSON5 (parsing failed)';
                error.validationMessage = `JSON5.parse error:  ${err.message}`;
                throw error;
            }
        }
        else {
            let allowDuplicateKeys = true;
            let jsonValidationError = json_dup_key_validator_1.default.validate(renovateConfig, allowDuplicateKeys);
            if (jsonValidationError) {
                const error = new Error(error_messages_1.CONFIG_VALIDATION);
                error.configFile = configFile;
                error.validationError = 'Invalid JSON (parsing failed)';
                error.validationMessage = jsonValidationError;
                throw error;
            }
            allowDuplicateKeys = false;
            jsonValidationError = json_dup_key_validator_1.default.validate(renovateConfig, allowDuplicateKeys);
            if (jsonValidationError) {
                const error = new Error(error_messages_1.CONFIG_VALIDATION);
                error.configFile = configFile;
                error.validationError = 'Duplicate keys in JSON';
                error.validationMessage = JSON.stringify(jsonValidationError);
                throw error;
            }
            try {
                renovateJson = JSON.parse(renovateConfig);
            }
            catch (err) /* istanbul ignore next */ {
                logger_1.logger.debug({ renovateConfig }, 'Error parsing renovate config');
                const error = new Error(error_messages_1.CONFIG_VALIDATION);
                error.configFile = configFile;
                error.validationError = 'Invalid JSON (parsing failed)';
                error.validationMessage = `JSON.parse error:  ${err.message}`;
                throw error;
            }
        }
        logger_1.logger.debug({ configFile, config: renovateJson }, 'Repository config');
    }
    const cache = repository_1.getCache();
    cache.init = {
        configFile,
        contents: clone_1.clone(renovateJson),
    };
    const migratedConfig = await migrate_validate_1.migrateAndValidate(config, renovateJson);
    if (migratedConfig.errors.length) {
        const error = new Error(error_messages_1.CONFIG_VALIDATION);
        error.configFile = configFile;
        error.validationError =
            'The renovate configuration file contains some invalid settings';
        error.validationMessage = migratedConfig.errors
            .map((e) => e.message)
            .join(', ');
        throw error;
    }
    if (migratedConfig.warnings) {
        returnConfig.warnings = returnConfig.warnings.concat(migratedConfig.warnings);
    }
    delete migratedConfig.errors;
    delete migratedConfig.warnings;
    logger_1.logger.debug({ config: migratedConfig }, 'migrated config');
    // Decrypt before resolving in case we need npm authentication for any presets
    const decryptedConfig = decrypt_1.decryptConfig(migratedConfig, config.privateKey);
    // istanbul ignore if
    if (decryptedConfig.npmrc) {
        logger_1.logger.debug('Found npmrc in decrypted config - setting');
        npmApi.setNpmrc(decryptedConfig.npmrc);
    }
    // Decrypt after resolving in case the preset contains npm authentication instead
    const resolvedConfig = decrypt_1.decryptConfig(await presets.resolveConfigPresets(decryptedConfig, config), config.privateKey);
    delete resolvedConfig.privateKey;
    logger_1.logger.trace({ config: resolvedConfig }, 'resolved config');
    // istanbul ignore if
    if (resolvedConfig.npmrc) {
        logger_1.logger.debug('Ignoring any .npmrc files in repository due to configured npmrc');
        npmApi.setNpmrc(resolvedConfig.npmrc);
        resolvedConfig.ignoreNpmrcFile = true;
    }
    // istanbul ignore if
    if (resolvedConfig.hostRules) {
        logger_1.logger.debug('Setting hostRules from config');
        for (const rule of resolvedConfig.hostRules) {
            try {
                hostRules.add(rule);
            }
            catch (err) {
                logger_1.logger.warn({ err, config: rule }, 'Error setting hostRule from config');
            }
        }
        delete resolvedConfig.hostRules;
    }
    returnConfig = config_1.mergeChildConfig(returnConfig, resolvedConfig);
    returnConfig.renovateJsonPresent = true;
    returnConfig.packageRules = flatten_1.flattenPackageRules(returnConfig.packageRules);
    // istanbul ignore if
    if ((_a = returnConfig.ignorePaths) === null || _a === void 0 ? void 0 : _a.length) {
        logger_1.logger.debug({ ignorePaths: returnConfig.ignorePaths }, `Found repo ignorePaths`);
    }
    return returnConfig;
}
exports.mergeRenovateConfig = mergeRenovateConfig;
//# sourceMappingURL=config.js.map