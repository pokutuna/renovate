"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChildProcessEnv = void 0;
const basicEnvVars = [
    'HTTP_PROXY',
    'HTTPS_PROXY',
    'NO_PROXY',
    'HOME',
    'PATH',
    'LC_ALL',
    'LANG',
    'DOCKER_HOST',
];
function getChildProcessEnv(customEnvVars = []) {
    const env = {};
    if (global.trustLevel === 'high') {
        return Object.assign(env, process.env);
    }
    const envVars = [...basicEnvVars, ...customEnvVars];
    envVars.forEach((envVar) => {
        if (typeof process.env[envVar] !== 'undefined') {
            env[envVar] = process.env[envVar];
        }
    });
    return env;
}
exports.getChildProcessEnv = getChildProcessEnv;
//# sourceMappingURL=env.js.map