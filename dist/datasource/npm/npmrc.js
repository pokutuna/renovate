"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setNpmrc = exports.getNpmrc = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const ini_1 = __importDefault(require("ini"));
const logger_1 = require("../../logger");
const sanitize_1 = require("../../util/sanitize");
let npmrc = null;
let npmrcRaw;
function getNpmrc() {
    return npmrc;
}
exports.getNpmrc = getNpmrc;
function envReplace(value, env = process.env) {
    // istanbul ignore if
    if (!is_1.default.string(value)) {
        return value;
    }
    const ENV_EXPR = /(\\*)\$\{([^}]+)\}/g;
    return value.replace(ENV_EXPR, (match, esc, envVarName) => {
        if (env[envVarName] === undefined) {
            logger_1.logger.warn('Failed to replace env in config: ' + match);
            throw new Error('env-replace');
        }
        return env[envVarName];
    });
}
const envRe = /(\\*)\$\{([^}]+)\}/;
// TODO: better add to host rules
function sanitize(key, val) {
    if (!val || envRe.test(val)) {
        return;
    }
    if (key.endsWith('_authToken') || key.endsWith('_auth')) {
        sanitize_1.add(val);
    }
    else if (key.endsWith(':_password')) {
        sanitize_1.add(val);
        const password = Buffer.from(val, 'base64').toString();
        sanitize_1.add(password);
        const username = npmrc[key.replace(':_password', ':username')];
        sanitize_1.add(Buffer.from(`${username}:${password}`).toString('base64'));
    }
}
function setNpmrc(input) {
    if (input) {
        if (input === npmrcRaw) {
            return;
        }
        const existingNpmrc = npmrc;
        npmrcRaw = input;
        logger_1.logger.debug('Setting npmrc');
        npmrc = ini_1.default.parse(input.replace(/\\n/g, '\n'));
        for (const [key, val] of Object.entries(npmrc)) {
            if (global.trustLevel !== 'high') {
                sanitize(key, val);
            }
            if (global.trustLevel !== 'high' &&
                key.endsWith('registry') &&
                val &&
                val.includes('localhost')) {
                logger_1.logger.debug({ key, val }, 'Detected localhost registry - rejecting npmrc file');
                npmrc = existingNpmrc;
                return;
            }
        }
        if (global.trustLevel !== 'high') {
            return;
        }
        for (const key of Object.keys(npmrc)) {
            npmrc[key] = envReplace(npmrc[key]);
            sanitize(key, npmrc[key]);
        }
    }
    else if (npmrc) {
        logger_1.logger.debug('Resetting npmrc');
        npmrc = null;
        npmrcRaw = null;
    }
}
exports.setNpmrc = setNpmrc;
//# sourceMappingURL=npmrc.js.map