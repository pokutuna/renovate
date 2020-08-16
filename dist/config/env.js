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
exports.getConfig = exports.getEnvName = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const platforms_1 = require("../constants/platforms");
const datasourceDocker = __importStar(require("../datasource/docker"));
const logger_1 = require("../logger");
const definitions_1 = require("./definitions");
function getEnvName(option) {
    if (option.env === false) {
        return '';
    }
    if (option.env) {
        return option.env;
    }
    const nameWithUnderscores = option.name.replace(/([A-Z])/g, '_$1');
    return `RENOVATE_${nameWithUnderscores.toUpperCase()}`;
}
exports.getEnvName = getEnvName;
function getConfig(env) {
    const options = definitions_1.getOptions();
    const config = { hostRules: [] };
    const coersions = {
        boolean: (val) => val === 'true',
        array: (val) => val.split(',').map((el) => el.trim()),
        string: (val) => val.replace(/\\n/g, '\n'),
        object: (val) => JSON.parse(val),
        integer: parseInt,
    };
    options.forEach((option) => {
        if (option.env !== false) {
            const envName = getEnvName(option);
            if (env[envName]) {
                // istanbul ignore if
                if (option.type === 'array' && option.subType === 'object') {
                    try {
                        const parsed = JSON.parse(env[envName]);
                        if (is_1.default.array(parsed)) {
                            config[option.name] = parsed;
                        }
                        else {
                            logger_1.logger.debug({ val: env[envName], envName }, 'Could not parse object array');
                        }
                    }
                    catch (err) {
                        logger_1.logger.debug({ val: env[envName], envName }, 'Could not parse CLI');
                    }
                }
                else {
                    const coerce = coersions[option.type];
                    config[option.name] = coerce(env[envName]);
                }
            }
        }
    });
    if (env.GITHUB_COM_TOKEN) {
        config.hostRules.push({
            hostType: platforms_1.PLATFORM_TYPE_GITHUB,
            domainName: 'github.com',
            token: env.GITHUB_COM_TOKEN,
        });
    }
    if (env.DOCKER_USERNAME && env.DOCKER_PASSWORD) {
        config.hostRules.push({
            hostType: datasourceDocker.id,
            username: env.DOCKER_USERNAME,
            password: env.DOCKER_PASSWORD,
        });
    }
    // These env vars are deprecated and deleted to make sure they're not used
    const unsupportedEnv = [
        'BITBUCKET_TOKEN',
        'BITBUCKET_USERNAME',
        'BITBUCKET_PASSWORD',
        'GITHUB_ENDPOINT',
        'GITHUB_TOKEN',
        'GITLAB_ENDPOINT',
        'GITLAB_TOKEN',
        'VSTS_ENDPOINT',
        'VSTS_TOKEN',
    ];
    // eslint-disable-next-line no-param-reassign
    unsupportedEnv.forEach((val) => delete env[val]);
    return config;
}
exports.getConfig = getConfig;
//# sourceMappingURL=env.js.map