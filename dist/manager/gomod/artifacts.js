"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateArtifacts = void 0;
const shlex_1 = require("shlex");
const upath_1 = require("upath");
const platforms_1 = require("../../constants/platforms");
const logger_1 = require("../../logger");
const exec_1 = require("../../util/exec");
const common_1 = require("../../util/exec/common");
const fs_1 = require("../../util/fs");
const git_1 = require("../../util/git");
const host_rules_1 = require("../../util/host-rules");
function getPreCommands() {
    const credentials = host_rules_1.find({
        hostType: platforms_1.PLATFORM_TYPE_GITHUB,
        url: 'https://api.github.com/',
    });
    let preCommands = null;
    if (credentials === null || credentials === void 0 ? void 0 : credentials.token) {
        const token = shlex_1.quote(credentials.token);
        preCommands = [
            `git config --global url.\"https://${token}@github.com/\".insteadOf \"https://github.com/\"`,
        ];
    }
    return preCommands;
}
async function updateArtifacts({ packageFileName: goModFileName, updatedDeps: _updatedDeps, newPackageFileContent: newGoModContent, config, }) {
    var _a, _b, _c;
    logger_1.logger.debug(`gomod.updateArtifacts(${goModFileName})`);
    const goPath = await fs_1.ensureCacheDir('./others/go', 'GOPATH');
    logger_1.logger.debug(`Using GOPATH: ${goPath}`);
    const sumFileName = goModFileName.replace(/\.mod$/, '.sum');
    const existingGoSumContent = await fs_1.readLocalFile(sumFileName);
    if (!existingGoSumContent) {
        logger_1.logger.debug('No go.sum found');
        return null;
    }
    const vendorDir = upath_1.join(upath_1.dirname(goModFileName), 'vendor/');
    const vendorModulesFileName = upath_1.join(vendorDir, 'modules.txt');
    const useVendor = (await fs_1.readLocalFile(vendorModulesFileName)) !== null;
    try {
        const massagedGoMod = newGoModContent.replace(/\n(replace\s+[^\s]+\s+=>\s+\.\.\/.*)/g, '\n// renovate-replace $1');
        if (massagedGoMod !== newGoModContent) {
            logger_1.logger.debug('Removed some relative replace statements from go.mod');
        }
        await fs_1.writeLocalFile(goModFileName, massagedGoMod);
        const cmd = 'go';
        const execOptions = {
            cwdFile: goModFileName,
            extraEnv: {
                GOPATH: goPath,
                GOPROXY: process.env.GOPROXY,
                GOPRIVATE: process.env.GOPRIVATE,
                GONOSUMDB: process.env.GONOSUMDB,
                CGO_ENABLED: config.binarySource === common_1.BinarySource.Docker ? '0' : null,
            },
            docker: {
                image: 'renovate/go',
                tagConstraint: (_a = config.compatibility) === null || _a === void 0 ? void 0 : _a.go,
                tagScheme: 'npm',
                volumes: [goPath],
                preCommands: getPreCommands(),
            },
        };
        let args = 'get -d ./...';
        logger_1.logger.debug({ cmd, args }, 'go get command included');
        const execCommands = [`${cmd} ${args}`];
        if ((_b = config.postUpdateOptions) === null || _b === void 0 ? void 0 : _b.includes('gomodTidy')) {
            args = 'mod tidy';
            logger_1.logger.debug({ cmd, args }, 'go mod tidy command included');
            execCommands.push(`${cmd} ${args}`);
        }
        if (useVendor) {
            args = 'mod vendor';
            logger_1.logger.debug({ cmd, args }, 'go mod vendor command included');
            execCommands.push(`${cmd} ${args}`);
            if ((_c = config.postUpdateOptions) === null || _c === void 0 ? void 0 : _c.includes('gomodTidy')) {
                args = 'mod tidy';
                logger_1.logger.debug({ cmd, args }, 'go mod tidy command included');
                execCommands.push(`${cmd} ${args}`);
            }
        }
        await exec_1.exec(execCommands, execOptions);
        const status = await git_1.getRepoStatus();
        if (!status.modified.includes(sumFileName)) {
            return null;
        }
        logger_1.logger.debug('Returning updated go.sum');
        const res = [
            {
                file: {
                    name: sumFileName,
                    contents: await fs_1.readLocalFile(sumFileName),
                },
            },
        ];
        if (useVendor) {
            for (const f of status.modified.concat(status.not_added)) {
                if (f.startsWith(vendorDir)) {
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
        const finalGoModContent = (await fs_1.readLocalFile(goModFileName, 'utf8')).replace(/\/\/ renovate-replace /g, '');
        if (finalGoModContent !== newGoModContent) {
            logger_1.logger.debug('Found updated go.mod after go.sum update');
            res.push({
                file: {
                    name: goModFileName,
                    contents: finalGoModContent,
                },
            });
        }
        return res;
    }
    catch (err) {
        logger_1.logger.debug({ err }, 'Failed to update go.sum');
        return [
            {
                artifactError: {
                    lockFile: sumFileName,
                    stderr: err.message,
                },
            },
        ];
    }
}
exports.updateArtifacts = updateArtifacts;
//# sourceMappingURL=artifacts.js.map