"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateArtifacts = void 0;
const shlex_1 = require("shlex");
const upath_1 = require("upath");
const logger_1 = require("../../logger");
const exec_1 = require("../../util/exec");
const fs_1 = require("../../util/fs");
const git_1 = require("../../util/git");
const utils_1 = require("./utils");
const pluginRegex = /^\s*plugin\s*(['"])(?<plugin>[^'"]+)\1/;
function getPluginCommands(content) {
    const result = new Set();
    const lines = content.split('\n');
    lines.forEach((line) => {
        const match = pluginRegex.exec(line);
        if (match) {
            const { plugin } = match.groups;
            result.add(`gem install ${shlex_1.quote(plugin)}`);
        }
    });
    return [...result];
}
async function updateArtifacts({ packageFileName, updatedDeps, newPackageFileContent, config, }) {
    var _a, _b;
    logger_1.logger.debug(`cocoapods.getArtifacts(${packageFileName})`);
    if (updatedDeps.length < 1) {
        logger_1.logger.debug('CocoaPods: empty update - returning null');
        return null;
    }
    const lockFileName = fs_1.getSiblingFileName(packageFileName, 'Podfile.lock');
    try {
        await fs_1.writeLocalFile(packageFileName, newPackageFileContent);
    }
    catch (err) {
        logger_1.logger.warn({ err }, 'Podfile could not be written');
        return [
            {
                artifactError: {
                    lockFile: lockFileName,
                    stderr: err.message,
                },
            },
        ];
    }
    const existingLockFileContent = await fs_1.readLocalFile(lockFileName, 'utf8');
    if (!existingLockFileContent) {
        logger_1.logger.debug(`Lockfile not found: ${lockFileName}`);
        return null;
    }
    const match = new RegExp(/^COCOAPODS: (?<cocoapodsVersion>.*)$/m).exec(existingLockFileContent);
    const tagConstraint = (_b = (_a = match === null || match === void 0 ? void 0 : match.groups) === null || _a === void 0 ? void 0 : _a.cocoapodsVersion) !== null && _b !== void 0 ? _b : null;
    const cmd = [...getPluginCommands(newPackageFileContent), 'pod install'];
    const execOptions = {
        cwdFile: packageFileName,
        extraEnv: {
            CP_HOME_DIR: await utils_1.getCocoaPodsHome(config),
        },
        docker: {
            image: 'renovate/cocoapods',
            tagScheme: 'ruby',
            tagConstraint,
        },
    };
    try {
        await exec_1.exec(cmd, execOptions);
    }
    catch (err) {
        return [
            {
                artifactError: {
                    lockFile: lockFileName,
                    stderr: err.stderr || err.stdout || err.message,
                },
            },
        ];
    }
    const status = await git_1.getRepoStatus();
    if (!status.modified.includes(lockFileName)) {
        return null;
    }
    logger_1.logger.debug(`Returning updated lockfile: ${lockFileName}`);
    const lockFileContent = await fs_1.readLocalFile(lockFileName);
    const res = [
        {
            file: {
                name: lockFileName,
                contents: lockFileContent,
            },
        },
    ];
    const podsDir = upath_1.join(upath_1.dirname(packageFileName), 'Pods');
    const podsManifestFileName = upath_1.join(podsDir, 'Manifest.lock');
    if (await fs_1.readLocalFile(podsManifestFileName, 'utf8')) {
        for (const f of status.modified.concat(status.not_added)) {
            if (f.startsWith(podsDir)) {
                res.push({
                    file: {
                        name: f,
                        contents: await fs_1.readLocalFile(f),
                    },
                });
            }
        }
        for (const f of status.deleted || []) {
            res.push({
                file: {
                    name: '|delete|',
                    contents: f,
                },
            });
        }
    }
    return res;
}
exports.updateArtifacts = updateArtifacts;
//# sourceMappingURL=artifacts.js.map