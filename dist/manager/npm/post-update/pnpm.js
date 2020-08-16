"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLockFile = void 0;
const semver_1 = require("semver");
const shlex_1 = require("shlex");
const upath_1 = require("upath");
const logger_1 = require("../../../logger");
const exec_1 = require("../../../util/exec");
const fs_1 = require("../../../util/fs");
const node_version_1 = require("./node-version");
async function generateLockFile(cwd, env, config, upgrades = []) {
    var _a;
    const lockFileName = upath_1.join(cwd, 'pnpm-lock.yaml');
    logger_1.logger.debug(`Spawning pnpm install to create ${lockFileName}`);
    let lockFile = null;
    let stdout;
    let stderr;
    let cmd = 'pnpm';
    try {
        let installPnpm = 'npm i -g pnpm';
        const pnpmCompatibility = (_a = config.compatibility) === null || _a === void 0 ? void 0 : _a.pnpm;
        if (semver_1.validRange(pnpmCompatibility)) {
            installPnpm += `@${shlex_1.quote(pnpmCompatibility)}`;
        }
        const preCommands = [installPnpm];
        const tagConstraint = await node_version_1.getNodeConstraint(config);
        const execOptions = {
            cwd,
            extraEnv: {
                NPM_CONFIG_CACHE: env.NPM_CONFIG_CACHE,
                npm_config_store: env.npm_config_store,
            },
            docker: {
                image: 'renovate/node',
                tagScheme: 'npm',
                tagConstraint,
                preCommands,
            },
        };
        if (config.dockerMapDotfiles) {
            const homeDir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
            const homeNpmrc = upath_1.join(homeDir, '.npmrc');
            execOptions.docker.volumes = [[homeNpmrc, '/home/ubuntu/.npmrc']];
        }
        cmd = 'pnpm';
        let args = 'install --recursive --lockfile-only';
        if (global.trustLevel !== 'high' || config.ignoreScripts) {
            args += ' --ignore-scripts';
            args += ' --ignore-pnpmfile';
        }
        logger_1.logger.debug({ cmd, args }, 'pnpm command');
        if (upgrades.find((upgrade) => upgrade.isLockFileMaintenance)) {
            logger_1.logger.debug(`Removing ${lockFileName} first due to lock file maintenance upgrade`);
            try {
                await fs_1.remove(lockFileName);
            }
            catch (err) /* istanbul ignore next */ {
                logger_1.logger.debug({ err, lockFileName }, 'Error removing yarn.lock for lock file maintenance');
            }
        }
        await exec_1.exec(`${cmd} ${args}`, execOptions);
        lockFile = await fs_1.readFile(lockFileName, 'utf8');
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.debug({
            cmd,
            err,
            stdout,
            stderr,
            type: 'pnpm',
        }, 'lock file error');
        return { error: true, stderr: err.stderr, stdout: err.stdout };
    }
    return { lockFile };
}
exports.generateLockFile = generateLockFile;
//# sourceMappingURL=pnpm.js.map