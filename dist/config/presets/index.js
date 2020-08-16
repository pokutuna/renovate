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
exports.resolveConfigPresets = exports.getPreset = exports.parsePreset = exports.replaceArgs = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const error_messages_1 = require("../../constants/error-messages");
const logger_1 = require("../../logger");
const external_host_error_1 = require("../../types/errors/external-host-error");
const regex_1 = require("../../util/regex");
const massage = __importStar(require("../massage"));
const migration = __importStar(require("../migration"));
const utils_1 = require("../utils");
const github = __importStar(require("./github"));
const gitlab = __importStar(require("./gitlab"));
const internal = __importStar(require("./internal"));
const local = __importStar(require("./local"));
const npm = __importStar(require("./npm"));
const presetSources = {
    github,
    npm,
    gitlab,
    local,
    internal,
};
function replaceArgs(obj, argMapping) {
    if (is_1.default.string(obj)) {
        let returnStr = obj;
        for (const [arg, argVal] of Object.entries(argMapping)) {
            const re = regex_1.regEx(`{{${arg}}}`, 'g');
            returnStr = returnStr.replace(re, argVal);
        }
        return returnStr;
    }
    if (is_1.default.array(obj)) {
        const returnArray = [];
        for (const item of obj) {
            returnArray.push(replaceArgs(item, argMapping));
        }
        return returnArray;
    }
    if (is_1.default.object(obj)) {
        const returnObj = {};
        for (const [key, val] of Object.entries(obj)) {
            returnObj[key] = replaceArgs(val, argMapping);
        }
        return returnObj;
    }
    return obj;
}
exports.replaceArgs = replaceArgs;
function parsePreset(input) {
    let str = input;
    let presetSource;
    let packageName;
    let presetName;
    let params;
    if (str.startsWith('github>')) {
        presetSource = 'github';
        str = str.substring('github>'.length);
    }
    else if (str.startsWith('gitlab>')) {
        presetSource = 'gitlab';
        str = str.substring('gitlab>'.length);
    }
    else if (str.startsWith('local>')) {
        presetSource = 'local';
        str = str.substring('local>'.length);
    }
    else if (!str.startsWith('@') &&
        !str.startsWith(':') &&
        str.includes('/')) {
        presetSource = 'local';
    }
    str = str.replace(/^npm>/, '');
    presetSource = presetSource || 'npm';
    if (str.includes('(')) {
        params = str
            .slice(str.indexOf('(') + 1, -1)
            .split(',')
            .map((elem) => elem.trim());
        str = str.slice(0, str.indexOf('('));
    }
    const presetsPackages = [
        'config',
        'default',
        'docker',
        'group',
        'helpers',
        'monorepo',
        'packages',
        'preview',
        'schedule',
    ];
    if (presetsPackages.some((presetPackage) => str.startsWith(`${presetPackage}:`))) {
        presetSource = 'internal';
        [packageName, presetName] = str.split(':');
    }
    else if (str.startsWith(':')) {
        // default namespace
        presetSource = 'internal';
        packageName = 'default';
        presetName = str.slice(1);
    }
    else if (str.startsWith('@')) {
        // scoped namespace
        [, packageName] = /(@.*?)(:|$)/.exec(str);
        str = str.slice(packageName.length);
        if (!packageName.includes('/')) {
            packageName += '/renovate-config';
        }
        if (str === '') {
            presetName = 'default';
        }
        else {
            presetName = str.slice(1);
        }
    }
    else {
        // non-scoped namespace
        [, packageName] = /(.*?)(:|$)/.exec(str);
        presetName = str.slice(packageName.length + 1);
        if (presetSource === 'npm' && !packageName.startsWith('renovate-config-')) {
            packageName = `renovate-config-${packageName}`;
        }
        if (presetName === '') {
            presetName = 'default';
        }
    }
    return { presetSource, packageName, presetName, params };
}
exports.parsePreset = parsePreset;
async function getPreset(preset, baseConfig) {
    logger_1.logger.trace(`getPreset(${preset})`);
    const { presetSource, packageName, presetName, params } = parsePreset(preset);
    let presetConfig = await presetSources[presetSource].getPreset({
        packageName,
        presetName,
        baseConfig,
    });
    logger_1.logger.trace({ presetConfig }, `Found preset ${preset}`);
    if (params) {
        const argMapping = {};
        for (const [index, value] of params.entries()) {
            argMapping[`arg${index}`] = value;
        }
        presetConfig = replaceArgs(presetConfig, argMapping);
    }
    logger_1.logger.trace({ presetConfig }, `Applied params to preset ${preset}`);
    const presetKeys = Object.keys(presetConfig);
    // istanbul ignore if
    if (presetKeys.length === 2 &&
        presetKeys.includes('description') &&
        presetKeys.includes('extends')) {
        // preset is just a collection of other presets
        delete presetConfig.description;
    }
    const packageListKeys = [
        'description',
        'packageNames',
        'excludePackageNames',
        'packagePatterns',
        'excludePackagePatterns',
    ];
    if (presetKeys.every((key) => packageListKeys.includes(key))) {
        delete presetConfig.description;
    }
    const { migratedConfig } = migration.migrateConfig(presetConfig);
    return massage.massageConfig(migratedConfig);
}
exports.getPreset = getPreset;
async function resolveConfigPresets(inputConfig, baseConfig, ignorePresets, existingPresets = []) {
    var _a, _b;
    if (!ignorePresets || ignorePresets.length === 0) {
        ignorePresets = inputConfig.ignorePresets || []; // eslint-disable-line
    }
    logger_1.logger.trace({ config: inputConfig, existingPresets }, 'resolveConfigPresets');
    let config = {};
    // First, merge all the preset configs from left to right
    if ((_a = inputConfig.extends) === null || _a === void 0 ? void 0 : _a.length) {
        for (const preset of inputConfig.extends) {
            // istanbul ignore if
            if (existingPresets.includes(preset)) {
                logger_1.logger.debug(`Already seen preset ${preset} in ${existingPresets}`);
            }
            else if (ignorePresets.includes(preset)) {
                // istanbul ignore next
                logger_1.logger.debug(`Ignoring preset ${preset} in ${existingPresets}`);
            }
            else {
                logger_1.logger.trace(`Resolving preset "${preset}"`);
                let fetchedPreset;
                try {
                    fetchedPreset = await getPreset(preset, baseConfig);
                }
                catch (err) {
                    logger_1.logger.debug({ preset, err }, 'Preset fetch error');
                    // istanbul ignore if
                    if (err instanceof external_host_error_1.ExternalHostError) {
                        throw err;
                    }
                    // istanbul ignore if
                    if (err.message === error_messages_1.PLATFORM_RATE_LIMIT_EXCEEDED) {
                        throw err;
                    }
                    const error = new Error(error_messages_1.CONFIG_VALIDATION);
                    if (err.message === 'dep not found') {
                        error.validationError = `Cannot find preset's package (${preset})`;
                    }
                    else if (err.message === 'preset renovate-config not found') {
                        error.validationError = `Preset package is missing a renovate-config entry (${preset})`;
                    }
                    else if (err.message === 'preset not found') {
                        error.validationError = `Preset name not found within published preset config (${preset})`;
                    }
                    // istanbul ignore if
                    if (existingPresets.length) {
                        error.validationError +=
                            '. Note: this is a *nested* preset so please contact the preset author if you are unable to fix it yourself.';
                    }
                    logger_1.logger.info({ validationError: error.validationError }, 'Throwing preset error');
                    throw error;
                }
                const presetConfig = await resolveConfigPresets(fetchedPreset, baseConfig, ignorePresets, existingPresets.concat([preset]));
                // istanbul ignore if
                if (((_b = inputConfig === null || inputConfig === void 0 ? void 0 : inputConfig.ignoreDeps) === null || _b === void 0 ? void 0 : _b.length) === 0) {
                    delete presetConfig.description;
                }
                config = utils_1.mergeChildConfig(config, presetConfig);
            }
        }
    }
    logger_1.logger.trace({ config }, `Post-preset resolve config`);
    // Now assign "regular" config on top
    config = utils_1.mergeChildConfig(config, inputConfig);
    delete config.extends;
    delete config.ignorePresets;
    logger_1.logger.trace({ config }, `Post-merge resolve config`);
    for (const [key, val] of Object.entries(config)) {
        const ignoredKeys = ['content', 'onboardingConfig'];
        if (is_1.default.array(val)) {
            // Resolve nested objects inside arrays
            config[key] = [];
            for (const element of val) {
                if (is_1.default.object(element)) {
                    config[key].push(await resolveConfigPresets(element, baseConfig, ignorePresets, existingPresets));
                }
                else {
                    config[key].push(element);
                }
            }
        }
        else if (is_1.default.object(val) && !ignoredKeys.includes(key)) {
            // Resolve nested objects
            logger_1.logger.trace(`Resolving object "${key}"`);
            config[key] = await resolveConfigPresets(val, baseConfig, ignorePresets, existingPresets);
        }
    }
    logger_1.logger.trace({ config: inputConfig }, 'Input config');
    logger_1.logger.trace({ config }, 'Resolved config');
    return config;
}
exports.resolveConfigPresets = resolveConfigPresets;
//# sourceMappingURL=index.js.map