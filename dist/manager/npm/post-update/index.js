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
exports.getAdditionalFiles = exports.writeUpdatedPackageFiles = exports.writeExistingFiles = exports.determineLockFileDirs = void 0;
const path_1 = __importDefault(require("path"));
const is_1 = __importDefault(require("@sindresorhus/is"));
const upath_1 = __importDefault(require("upath"));
const error_messages_1 = require("../../../constants/error-messages");
const npm_1 = require("../../../datasource/npm");
const logger_1 = require("../../../logger");
const external_host_error_1 = require("../../../types/errors/external-host-error");
const env_1 = require("../../../util/exec/env");
const fs_1 = require("../../../util/fs");
const git_1 = require("../../../util/git");
const hostRules = __importStar(require("../../../util/host-rules"));
const lerna = __importStar(require("./lerna"));
const npm = __importStar(require("./npm"));
const pnpm = __importStar(require("./pnpm"));
const yarn = __importStar(require("./yarn"));
// Strips empty values, deduplicates, and returns the directories from filenames
// istanbul ignore next
const getDirs = (arr) => Array.from(new Set(arr.filter(Boolean)));
// istanbul ignore next
function determineLockFileDirs(config, packageFiles) {
    const npmLockDirs = [];
    const yarnLockDirs = [];
    const pnpmShrinkwrapDirs = [];
    const lernaDirs = [];
    for (const upgrade of config.upgrades) {
        if (upgrade.updateType === 'lockFileMaintenance') {
            // Return every directory that contains a lockfile
            if (upgrade.lernaDir && upgrade.npmLock) {
                lernaDirs.push(upgrade.lernaDir);
            }
            else {
                yarnLockDirs.push(upgrade.yarnLock);
                npmLockDirs.push(upgrade.npmLock);
                pnpmShrinkwrapDirs.push(upgrade.pnpmShrinkwrap);
            }
            continue; // eslint-disable-line no-continue
        }
        if (upgrade.isLockfileUpdate) {
            yarnLockDirs.push(upgrade.yarnLock);
            npmLockDirs.push(upgrade.npmLock);
        }
    }
    if (config.upgrades.every((upgrade) => upgrade.updateType === 'lockFileMaintenance' || upgrade.isLockfileUpdate)) {
        return {
            yarnLockDirs: getDirs(yarnLockDirs),
            npmLockDirs: getDirs(npmLockDirs),
            pnpmShrinkwrapDirs: getDirs(pnpmShrinkwrapDirs),
            lernaDirs: getDirs(lernaDirs),
        };
    }
    function getPackageFile(fileName) {
        logger_1.logger.trace('Looking for packageFile: ' + fileName);
        for (const packageFile of packageFiles.npm) {
            if (packageFile.packageFile === fileName) {
                logger_1.logger.trace({ packageFile }, 'Found packageFile');
                return packageFile;
            }
            logger_1.logger.trace('No match');
        }
        return {};
    }
    for (const p of config.updatedPackageFiles) {
        logger_1.logger.trace(`Checking ${p.name} for lock files`);
        const packageFile = getPackageFile(p.name);
        // lerna first
        if (packageFile.lernaDir && packageFile.npmLock) {
            logger_1.logger.debug(`${packageFile.packageFile} has lerna lock file`);
            lernaDirs.push(packageFile.lernaDir);
        }
        else if (packageFile.lernaDir &&
            packageFile.yarnLock &&
            !packageFile.hasYarnWorkspaces) {
            lernaDirs.push(packageFile.lernaDir);
        }
        else {
            // push full lock file names and convert them later
            yarnLockDirs.push(packageFile.yarnLock);
            npmLockDirs.push(packageFile.npmLock);
            pnpmShrinkwrapDirs.push(packageFile.pnpmShrinkwrap);
        }
    }
    return {
        yarnLockDirs: getDirs(yarnLockDirs),
        npmLockDirs: getDirs(npmLockDirs),
        pnpmShrinkwrapDirs: getDirs(pnpmShrinkwrapDirs),
        lernaDirs: getDirs(lernaDirs),
    };
}
exports.determineLockFileDirs = determineLockFileDirs;
// istanbul ignore next
async function writeExistingFiles(config, packageFiles) {
    const npmrcFile = upath_1.default.join(config.localDir, '.npmrc');
    if (config.npmrc) {
        logger_1.logger.debug(`Writing repo .npmrc (${config.localDir})`);
        await fs_1.outputFile(npmrcFile, config.npmrc);
    }
    else if (config.ignoreNpmrcFile) {
        logger_1.logger.debug('Removing ignored .npmrc file before artifact generation');
        await fs_1.remove(npmrcFile);
    }
    if (is_1.default.string(config.yarnrc)) {
        logger_1.logger.debug(`Writing repo .yarnrc (${config.localDir})`);
        await fs_1.outputFile(upath_1.default.join(config.localDir, '.yarnrc'), config.yarnrc);
    }
    if (!packageFiles.npm) {
        return;
    }
    const npmFiles = packageFiles.npm;
    logger_1.logger.debug({ packageFiles: npmFiles.map((n) => n.packageFile) }, 'Writing package.json files');
    for (const packageFile of npmFiles) {
        const basedir = upath_1.default.join(config.localDir, path_1.default.dirname(packageFile.packageFile));
        const npmrc = packageFile.npmrc || config.npmrc;
        const npmrcFilename = upath_1.default.join(basedir, '.npmrc');
        if (npmrc) {
            try {
                await fs_1.outputFile(npmrcFilename, npmrc);
            }
            catch (err) /* istanbul ignore next */ {
                logger_1.logger.warn({ npmrcFilename, err }, 'Error writing .npmrc');
            }
        }
        if (packageFile.yarnrc) {
            logger_1.logger.debug(`Writing .yarnrc to ${basedir}`);
            const yarnrcFilename = upath_1.default.join(basedir, '.yarnrc');
            try {
                await fs_1.outputFile(yarnrcFilename, packageFile.yarnrc
                    .replace('--install.pure-lockfile true', '')
                    .replace('--install.frozen-lockfile true', ''));
            }
            catch (err) /* istanbul ignore next */ {
                logger_1.logger.warn({ yarnrcFilename, err }, 'Error writing .yarnrc');
            }
        }
        const { npmLock } = packageFile;
        if (npmLock) {
            const npmLockPath = upath_1.default.join(config.localDir, npmLock);
            if (process.env.RENOVATE_REUSE_PACKAGE_LOCK === 'false' ||
                config.reuseLockFiles === false) {
                logger_1.logger.debug(`Ensuring ${npmLock} is removed`);
                await fs_1.remove(npmLockPath);
            }
            else {
                logger_1.logger.debug(`Writing ${npmLock}`);
                let existingNpmLock = await git_1.getFile(npmLock);
                const widens = [];
                for (const upgrade of config.upgrades) {
                    if (upgrade.rangeStrategy === 'widen' &&
                        upgrade.npmLock === npmLock) {
                        widens.push(upgrade.depName);
                    }
                }
                if (widens.length) {
                    logger_1.logger.debug(`Removing ${widens} from ${npmLock} to force an update`);
                    try {
                        const npmLockParsed = JSON.parse(existingNpmLock);
                        if (npmLockParsed.dependencies) {
                            widens.forEach((depName) => {
                                delete npmLockParsed.dependencies[depName];
                            });
                        }
                        existingNpmLock = JSON.stringify(npmLockParsed, null, 2);
                    }
                    catch (err) {
                        logger_1.logger.warn({ npmLock }, 'Error massaging package-lock.json for widen');
                    }
                }
                await fs_1.outputFile(npmLockPath, existingNpmLock);
            }
        }
        const { yarnLock } = packageFile;
        if (yarnLock && config.reuseLockFiles === false) {
            await fs_1.deleteLocalFile(yarnLock);
        }
        // istanbul ignore next
        if (packageFile.pnpmShrinkwrap && config.reuseLockFiles === false) {
            await fs_1.deleteLocalFile(packageFile.pnpmShrinkwrap);
        }
    }
}
exports.writeExistingFiles = writeExistingFiles;
// istanbul ignore next
async function writeUpdatedPackageFiles(config) {
    logger_1.logger.trace({ config }, 'writeUpdatedPackageFiles');
    logger_1.logger.debug('Writing any updated package files');
    if (!config.updatedPackageFiles) {
        logger_1.logger.debug('No files found');
        return;
    }
    for (const packageFile of config.updatedPackageFiles) {
        if (!packageFile.name.endsWith('package.json')) {
            continue; // eslint-disable-line
        }
        logger_1.logger.debug(`Writing ${packageFile.name}`);
        const massagedFile = JSON.parse(packageFile.contents);
        try {
            const { token } = hostRules.find({
                hostType: config.platform,
                url: 'https://api.github.com/',
            });
            for (const upgrade of config.upgrades) {
                if (upgrade.gitRef && upgrade.packageFile === packageFile.name) {
                    massagedFile[upgrade.depType][upgrade.depName] = massagedFile[upgrade.depType][upgrade.depName].replace('git+https://github.com', `git+https://${token}@github.com`);
                }
            }
        }
        catch (err) {
            logger_1.logger.warn({ err }, 'Error adding token to package files');
        }
        await fs_1.outputFile(upath_1.default.join(config.localDir, packageFile.name), JSON.stringify(massagedFile));
    }
}
exports.writeUpdatedPackageFiles = writeUpdatedPackageFiles;
// istanbul ignore next
async function getNpmrcContent(dir) {
    const npmrcFilePath = upath_1.default.join(dir, '.npmrc');
    let originalNpmrcContent = null;
    try {
        originalNpmrcContent = await fs_1.readFile(npmrcFilePath, 'utf8');
        logger_1.logger.debug('npmrc file found in repository');
    }
    catch (_a) {
        logger_1.logger.debug('No npmrc file found in repository');
        originalNpmrcContent = null;
    }
    return originalNpmrcContent;
}
// istanbul ignore next
async function updateNpmrcContent(dir, originalContent, additionalLines) {
    const npmrcFilePath = upath_1.default.join(dir, '.npmrc');
    const newNpmrc = originalContent
        ? [originalContent, ...additionalLines]
        : additionalLines;
    try {
        const newContent = newNpmrc.join('\n');
        if (newContent !== originalContent) {
            await fs_1.writeFile(npmrcFilePath, newContent);
        }
    }
    catch (_a) {
        logger_1.logger.warn('Unable to write custom npmrc file');
    }
}
// istanbul ignore next
async function resetNpmrcContent(dir, originalContent) {
    const npmrcFilePath = upath_1.default.join(dir, '.npmrc');
    if (originalContent) {
        try {
            await fs_1.writeFile(npmrcFilePath, originalContent);
        }
        catch (_a) {
            logger_1.logger.warn('Unable to reset npmrc to original contents');
        }
    }
    else {
        try {
            await fs_1.unlink(npmrcFilePath);
        }
        catch (_b) {
            logger_1.logger.warn('Unable to delete custom npmrc');
        }
    }
}
// istanbul ignore next
async function getAdditionalFiles(config, packageFiles) {
    var _a, _b, _c, _d;
    logger_1.logger.trace({ config }, 'getAdditionalFiles');
    const artifactErrors = [];
    const updatedArtifacts = [];
    if (!((_a = packageFiles.npm) === null || _a === void 0 ? void 0 : _a.length)) {
        return { artifactErrors, updatedArtifacts };
    }
    if (!config.updateLockFiles) {
        logger_1.logger.debug('Skipping lock file generation');
        return { artifactErrors, updatedArtifacts };
    }
    logger_1.logger.debug('Getting updated lock files');
    if (config.updateType === 'lockFileMaintenance' &&
        config.reuseExistingBranch &&
        (await git_1.branchExists(config.branchName))) {
        logger_1.logger.debug('Skipping lockFileMaintenance update');
        return { artifactErrors, updatedArtifacts };
    }
    const dirs = determineLockFileDirs(config, packageFiles);
    logger_1.logger.debug({ dirs }, 'lock file dirs');
    await writeExistingFiles(config, packageFiles);
    await writeUpdatedPackageFiles(config);
    // Determine the additional npmrc content to add based on host rules
    const additionalNpmrcContent = [];
    const npmHostRules = hostRules.findAll({
        hostType: 'npm',
    });
    for (const hostRule of npmHostRules) {
        if (hostRule.token) {
            if (hostRule.baseUrl) {
                additionalNpmrcContent.push(`${hostRule.baseUrl}:_authToken=${hostRule.token}`
                    .replace('https://', '//')
                    .replace('http://', '//'));
            }
            else if (hostRule.hostName) {
                additionalNpmrcContent.push(`//${hostRule.hostName}/:_authToken=${hostRule.token}`);
            }
        }
    }
    const env = env_1.getChildProcessEnv([
        'NPM_CONFIG_CACHE',
        'YARN_CACHE_FOLDER',
        'npm_config_store',
    ]);
    env.NPM_CONFIG_CACHE =
        env.NPM_CONFIG_CACHE || upath_1.default.join(config.cacheDir, './others/npm');
    await fs_1.ensureDir(env.NPM_CONFIG_CACHE);
    env.YARN_CACHE_FOLDER =
        env.YARN_CACHE_FOLDER || upath_1.default.join(config.cacheDir, './others/yarn');
    await fs_1.ensureDir(env.YARN_CACHE_FOLDER);
    env.npm_config_store =
        env.npm_config_store || upath_1.default.join(config.cacheDir, './others/pnpm');
    await fs_1.ensureDir(env.npm_config_store);
    env.NODE_ENV = 'dev';
    let token = '';
    try {
        ({ token } = hostRules.find({
            hostType: config.platform,
            url: 'https://api.github.com/',
        }));
        token += '@';
    }
    catch (err) {
        logger_1.logger.warn({ err }, 'Error getting token for packageFile');
    }
    for (const lockFile of dirs.npmLockDirs) {
        const lockFileDir = path_1.default.dirname(lockFile);
        const fullLockFileDir = upath_1.default.join(config.localDir, lockFileDir);
        const npmrcContent = await getNpmrcContent(fullLockFileDir);
        await updateNpmrcContent(fullLockFileDir, npmrcContent, additionalNpmrcContent);
        const fileName = path_1.default.basename(lockFile);
        logger_1.logger.debug(`Generating ${fileName} for ${lockFileDir}`);
        const upgrades = config.upgrades.filter((upgrade) => upgrade.npmLock === lockFile);
        const res = await npm.generateLockFile(fullLockFileDir, env, fileName, config, upgrades);
        if (res.error) {
            // istanbul ignore if
            if ((_b = res.stderr) === null || _b === void 0 ? void 0 : _b.includes('No matching version found for')) {
                for (const upgrade of config.upgrades) {
                    if (res.stderr.includes(`No matching version found for ${upgrade.depName}`)) {
                        logger_1.logger.debug({ dependency: upgrade.depName, type: 'npm' }, 'lock file failed for the dependency being updated - skipping branch creation');
                        const err = new Error('lock file failed for the dependency being updated - skipping branch creation');
                        throw new external_host_error_1.ExternalHostError(err, npm_1.id);
                    }
                }
            }
            artifactErrors.push({
                lockFile,
                stderr: res.stderr,
            });
        }
        else {
            const existingContent = await git_1.getFile(lockFile, config.reuseExistingBranch ? config.branchName : config.baseBranch);
            if (res.lockFile !== existingContent) {
                logger_1.logger.debug(`${lockFile} needs updating`);
                updatedArtifacts.push({
                    name: lockFile,
                    contents: res.lockFile.replace(new RegExp(`${token}`, 'g'), ''),
                });
            }
            else {
                logger_1.logger.debug(`${lockFile} hasn't changed`);
            }
        }
        await resetNpmrcContent(fullLockFileDir, npmrcContent);
    }
    for (const lockFile of dirs.yarnLockDirs) {
        const lockFileDir = path_1.default.dirname(lockFile);
        const fullLockFileDir = upath_1.default.join(config.localDir, lockFileDir);
        const npmrcContent = await getNpmrcContent(fullLockFileDir);
        await updateNpmrcContent(fullLockFileDir, npmrcContent, additionalNpmrcContent);
        logger_1.logger.debug(`Generating yarn.lock for ${lockFileDir}`);
        const lockFileName = upath_1.default.join(lockFileDir, 'yarn.lock');
        const upgrades = config.upgrades.filter((upgrade) => upgrade.yarnLock === lockFile);
        const res = await yarn.generateLockFile(upath_1.default.join(config.localDir, lockFileDir), env, config, upgrades);
        if (res.error) {
            // istanbul ignore if
            if ((_c = res.stderr) === null || _c === void 0 ? void 0 : _c.includes(`Couldn't find any versions for`)) {
                for (const upgrade of config.upgrades) {
                    /* eslint-disable no-useless-escape */
                    if (res.stderr.includes(`Couldn't find any versions for \\\"${upgrade.depName}\\\"`)) {
                        logger_1.logger.debug({ dependency: upgrade.depName, type: 'yarn' }, 'lock file failed for the dependency being updated - skipping branch creation');
                        throw new external_host_error_1.ExternalHostError(new Error('lock file failed for the dependency being updated - skipping branch creation'), npm_1.id);
                    }
                    /* eslint-enable no-useless-escape */
                }
            }
            artifactErrors.push({
                lockFile,
                stderr: res.stderr,
            });
        }
        else {
            const existingContent = await git_1.getFile(lockFileName, config.reuseExistingBranch ? config.branchName : config.baseBranch);
            if (res.lockFile !== existingContent) {
                logger_1.logger.debug('yarn.lock needs updating');
                updatedArtifacts.push({
                    name: lockFileName,
                    contents: res.lockFile,
                });
                // istanbul ignore next
                try {
                    const yarnrc = await git_1.getFile(upath_1.default.join(lockFileDir, '.yarnrc'));
                    if (yarnrc) {
                        const mirrorLine = yarnrc
                            .split('\n')
                            .find((line) => line.startsWith('yarn-offline-mirror '));
                        if (mirrorLine) {
                            const mirrorPath = mirrorLine
                                .split(' ')[1]
                                .replace(/"/g, '')
                                .replace(/\/?$/, '/');
                            const resolvedPath = upath_1.default.join(lockFileDir, mirrorPath);
                            logger_1.logger.debug('Found yarn offline  mirror: ' + resolvedPath);
                            const status = await git_1.getRepoStatus();
                            for (const f of status.modified.concat(status.not_added)) {
                                if (f.startsWith(resolvedPath)) {
                                    const localModified = upath_1.default.join(config.localDir, f);
                                    updatedArtifacts.push({
                                        name: f,
                                        contents: await fs_1.readFile(localModified),
                                    });
                                }
                            }
                            for (const f of status.deleted || []) {
                                if (f.startsWith(resolvedPath)) {
                                    updatedArtifacts.push({
                                        name: '|delete|',
                                        contents: f,
                                    });
                                }
                            }
                        }
                    }
                }
                catch (err) {
                    logger_1.logger.error({ err }, 'Error updating yarn offline packages');
                }
            }
            else {
                logger_1.logger.debug("yarn.lock hasn't changed");
            }
        }
        await resetNpmrcContent(fullLockFileDir, npmrcContent);
    }
    for (const lockFile of dirs.pnpmShrinkwrapDirs) {
        const lockFileDir = path_1.default.dirname(lockFile);
        const fullLockFileDir = upath_1.default.join(config.localDir, lockFileDir);
        const npmrcContent = await getNpmrcContent(fullLockFileDir);
        await updateNpmrcContent(fullLockFileDir, npmrcContent, additionalNpmrcContent);
        logger_1.logger.debug(`Generating pnpm-lock.yaml for ${lockFileDir}`);
        const upgrades = config.upgrades.filter((upgrade) => upgrade.pnpmShrinkwrap === lockFile);
        const res = await pnpm.generateLockFile(upath_1.default.join(config.localDir, lockFileDir), env, config, upgrades);
        if (res.error) {
            // istanbul ignore if
            if ((_d = res.stdout) === null || _d === void 0 ? void 0 : _d.includes(`No compatible version found:`)) {
                for (const upgrade of config.upgrades) {
                    if (res.stdout.includes(`No compatible version found: ${upgrade.depName}`)) {
                        logger_1.logger.debug({ dependency: upgrade.depName, type: 'pnpm' }, 'lock file failed for the dependency being updated - skipping branch creation');
                        throw new external_host_error_1.ExternalHostError(Error('lock file failed for the dependency being updated - skipping branch creation'), npm_1.id);
                    }
                }
            }
            artifactErrors.push({
                lockFile,
                stderr: res.stderr,
            });
        }
        else {
            const existingContent = await git_1.getFile(lockFile, config.reuseExistingBranch ? config.branchName : config.baseBranch);
            if (res.lockFile !== existingContent) {
                logger_1.logger.debug('pnpm-lock.yaml needs updating');
                updatedArtifacts.push({
                    name: lockFile,
                    contents: res.lockFile,
                });
            }
            else {
                logger_1.logger.debug("pnpm-lock.yaml hasn't changed");
            }
        }
        await resetNpmrcContent(fullLockFileDir, npmrcContent);
    }
    for (const lernaDir of dirs.lernaDirs) {
        let lockFile;
        logger_1.logger.debug(`Finding package.json for lerna directory "${lernaDir}"`);
        const lernaPackageFile = packageFiles.npm.find((p) => path_1.default.dirname(p.packageFile) === lernaDir);
        if (!lernaPackageFile) {
            logger_1.logger.debug('No matching package.json found');
            throw new Error('lerna-no-lockfile');
        }
        if (lernaPackageFile.lernaClient === 'npm') {
            lockFile = config.npmLock || 'package-lock.json';
        }
        else {
            lockFile = config.yarnLock || 'yarn.lock';
        }
        const skipInstalls = lockFile === 'npm-shrinkwrap.json' ? false : config.skipInstalls;
        const fullLearnaFileDir = upath_1.default.join(config.localDir, lernaDir);
        const npmrcContent = await getNpmrcContent(fullLearnaFileDir);
        await updateNpmrcContent(fullLearnaFileDir, npmrcContent, additionalNpmrcContent);
        const res = await lerna.generateLockFiles(lernaPackageFile, fullLearnaFileDir, config, env, skipInstalls);
        // istanbul ignore else
        if (res.stderr) {
            // istanbul ignore if
            if (res.stderr.includes('ENOSPC: no space left on device')) {
                throw new Error(error_messages_1.SYSTEM_INSUFFICIENT_DISK_SPACE);
            }
            for (const upgrade of config.upgrades) {
                /* eslint-disable no-useless-escape */
                if (res.stderr.includes(`Couldn't find any versions for \\\"${upgrade.depName}\\\"`)) {
                    logger_1.logger.debug({ dependency: upgrade.depName, type: 'yarn' }, 'lock file failed for the dependency being updated - skipping branch creation');
                    throw new external_host_error_1.ExternalHostError(Error('lock file failed for the dependency being updated - skipping branch creation'), npm_1.id);
                }
                /* eslint-enable no-useless-escape */
                if (res.stderr.includes(`No matching version found for ${upgrade.depName}`)) {
                    logger_1.logger.debug({ dependency: upgrade.depName, type: 'npm' }, 'lock file failed for the dependency being updated - skipping branch creation');
                    throw new external_host_error_1.ExternalHostError(Error('lock file failed for the dependency being updated - skipping branch creation'), npm_1.id);
                }
            }
            artifactErrors.push({
                lockFile,
                stderr: res.stderr,
            });
        }
        else {
            for (const packageFile of packageFiles.npm) {
                const filename = packageFile.npmLock || packageFile.yarnLock;
                logger_1.logger.trace('Checking for ' + filename);
                const existingContent = await git_1.getFile(filename, config.reuseExistingBranch ? config.branchName : config.baseBranch);
                if (existingContent) {
                    logger_1.logger.trace('Found lock file');
                    const lockFilePath = upath_1.default.join(config.localDir, filename);
                    logger_1.logger.trace('Checking against ' + lockFilePath);
                    try {
                        let newContent;
                        try {
                            newContent = await fs_1.readFile(lockFilePath, 'utf8');
                        }
                        catch (err) {
                            newContent = await fs_1.readFile(lockFilePath.replace('npm-shrinkwrap.json', 'package-lock.json'), 'utf8');
                        }
                        if (newContent !== existingContent) {
                            logger_1.logger.debug('File is updated: ' + lockFilePath);
                            updatedArtifacts.push({
                                name: filename,
                                contents: newContent,
                            });
                        }
                        else {
                            logger_1.logger.trace('File is unchanged');
                        }
                    }
                    catch (err) {
                        if (config.updateType === 'lockFileMaintenance') {
                            logger_1.logger.debug({ packageFile, lockFilePath }, 'No lock file found after lerna lockFileMaintenance');
                        }
                        else {
                            logger_1.logger.warn({ packageFile, lockFilePath }, 'No lock file found after lerna bootstrap');
                        }
                    }
                }
                else {
                    logger_1.logger.trace('No lock file found');
                }
            }
        }
        await resetNpmrcContent(fullLearnaFileDir, npmrcContent);
    }
    return { artifactErrors, updatedArtifacts };
}
exports.getAdditionalFiles = getAdditionalFiles;
//# sourceMappingURL=index.js.map