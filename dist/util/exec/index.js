"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exec = exports.setExecConfig = void 0;
const path_1 = require("path");
const logger_1 = require("../../logger");
const common_1 = require("./common");
const docker_1 = require("./docker");
const env_1 = require("./env");
const execConfig = {
    binarySource: null,
    dockerUser: null,
    localDir: null,
    cacheDir: null,
};
async function setExecConfig(config) {
    for (const key of Object.keys(execConfig)) {
        const value = config[key];
        execConfig[key] = value || null;
    }
    if (execConfig.binarySource === 'docker') {
        await docker_1.removeDanglingContainers();
    }
}
exports.setExecConfig = setExecConfig;
function createChildEnv(env, extraEnv) {
    const extraEnvEntries = Object.entries({ ...extraEnv }).filter(([_, val]) => {
        if (val === null) {
            return false;
        }
        if (val === undefined) {
            return false;
        }
        return true;
    });
    const extraEnvKeys = Object.keys(extraEnvEntries);
    const childEnv = env || extraEnv
        ? {
            ...extraEnv,
            ...env_1.getChildProcessEnv(extraEnvKeys),
            ...env,
        }
        : env_1.getChildProcessEnv();
    const result = {};
    Object.entries(childEnv).forEach(([key, val]) => {
        if (val === null) {
            return;
        }
        if (val === undefined) {
            return;
        }
        result[key] = val.toString();
    });
    return result;
}
function dockerEnvVars(extraEnv, childEnv) {
    const extraEnvKeys = Object.keys(extraEnv || {});
    return extraEnvKeys.filter((key) => typeof childEnv[key] === 'string' && childEnv[key].length > 0);
}
async function exec(cmd, opts = {}) {
    const { env, extraEnv, docker, cwdFile } = opts;
    let cwd;
    // istanbul ignore if
    if (cwdFile) {
        cwd = path_1.join(execConfig.localDir, path_1.dirname(cwdFile));
    }
    cwd = cwd || opts.cwd || execConfig.localDir;
    const childEnv = createChildEnv(env, extraEnv);
    const execOptions = { ...opts };
    delete execOptions.extraEnv;
    delete execOptions.docker;
    delete execOptions.cwdFile;
    const rawExecOptions = {
        encoding: 'utf-8',
        ...execOptions,
        env: childEnv,
        cwd,
    };
    // Set default timeout to 15 minutes
    rawExecOptions.timeout = rawExecOptions.timeout || 15 * 60 * 1000;
    let commands = typeof cmd === 'string' ? [cmd] : cmd;
    const useDocker = execConfig.binarySource === common_1.BinarySource.Docker && docker;
    if (useDocker) {
        logger_1.logger.debug('Using docker to execute');
        const dockerOptions = {
            ...docker,
            cwd,
            envVars: dockerEnvVars(extraEnv, childEnv),
        };
        const dockerCommand = await docker_1.generateDockerCommand(commands, dockerOptions, execConfig);
        commands = [dockerCommand];
    }
    let res = null;
    for (const rawExecCommand of commands) {
        const startTime = Date.now();
        let timer;
        const { timeout } = rawExecOptions;
        if (useDocker) {
            await docker_1.removeDockerContainer(docker.image);
            // istanbul ignore next
            timer = setTimeout(() => {
                docker_1.removeDockerContainer(docker.image); // eslint-disable-line
                logger_1.logger.info({ timeout, rawExecCommand }, 'Docker run timed out');
            }, timeout);
        }
        logger_1.logger.debug({ command: rawExecCommand }, 'Executing command');
        logger_1.logger.trace({ commandOptions: rawExecOptions }, 'Command options');
        try {
            res = await common_1.rawExec(rawExecCommand, rawExecOptions);
        }
        catch (err) {
            logger_1.logger.trace({ err }, 'rawExec err');
            clearTimeout(timer);
            if (useDocker) {
                await docker_1.removeDockerContainer(docker.image).catch((removeErr) => {
                    throw new Error(`Error: "${removeErr.message}" - Original Error: "${err.message}"`);
                });
            }
            throw err;
        }
        clearTimeout(timer);
        const durationMs = Math.round(Date.now() - startTime);
        if (res) {
            logger_1.logger.debug({
                cmd: rawExecCommand,
                durationMs,
                stdout: res.stdout,
                stderr: res.stderr,
            }, 'exec completed');
        }
    }
    return res;
}
exports.exec = exec;
//# sourceMappingURL=index.js.map