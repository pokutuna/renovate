"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateArtifacts = void 0;
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const logger_1 = require("../../logger");
const exec_1 = require("../../util/exec");
const fs_1 = require("../../util/fs");
const git_1 = require("../../util/git");
const http_1 = require("../../util/http");
const utils_1 = require("../gradle/utils");
const http = new http_1.Http('gradle-wrapper');
async function addIfUpdated(status, fileProjectPath) {
    if (status.modified.includes(fileProjectPath)) {
        return {
            file: {
                name: fileProjectPath,
                contents: await fs_1.readLocalFile(fileProjectPath),
            },
        };
    }
    return null;
}
function getDistributionUrl(newPackageFileContent) {
    const distributionUrlLine = newPackageFileContent
        .split('\n')
        .find((line) => line.startsWith('distributionUrl='));
    if (distributionUrlLine) {
        return distributionUrlLine
            .replace('distributionUrl=', '')
            .replace('https\\:', 'https:');
    }
    return null;
}
async function getDistributionChecksum(url) {
    const { body } = await http.get(`${url}.sha256`);
    return body;
}
async function updateArtifacts({ packageFileName, newPackageFileContent, updatedDeps, config, }) {
    try {
        const projectDir = config.localDir;
        logger_1.logger.debug({ updatedDeps }, 'gradle-wrapper.updateArtifacts()');
        const gradlew = utils_1.gradleWrapperFileName(config);
        const gradlewPath = path_1.resolve(projectDir, `./${gradlew}`);
        let cmd = await utils_1.prepareGradleCommand(gradlew, projectDir, await fs_extra_1.stat(gradlewPath).catch(() => null), `wrapper`);
        if (!cmd) {
            logger_1.logger.info('No gradlew found - skipping Artifacts update');
            return null;
        }
        const distributionUrl = getDistributionUrl(newPackageFileContent);
        if (distributionUrl) {
            cmd += ` --gradle-distribution-url ${distributionUrl}`;
            if (newPackageFileContent.includes('distributionSha256Sum=')) {
                // need to reset version, otherwise we have a checksum missmatch
                await fs_1.writeLocalFile(packageFileName, newPackageFileContent.replace(config.toVersion, config.currentValue));
                const checksum = await getDistributionChecksum(distributionUrl);
                cmd += ` --gradle-distribution-sha256-sum ${checksum}`;
            }
        }
        else {
            cmd += ` --gradle-version ${config.toVersion}`;
        }
        logger_1.logger.debug(`Updating gradle wrapper: "${cmd}"`);
        const execOptions = {
            docker: {
                image: 'renovate/gradle',
            },
            extraEnv: utils_1.extraEnv,
        };
        try {
            await exec_1.exec(cmd, execOptions);
        }
        catch (err) {
            // TODO: Is this an artifact error?
            logger_1.logger.warn({ err }, 'Error executing gradle wrapper update command. It can be not a critical one though.');
        }
        const status = await git_1.getRepoStatus();
        const artifactFileNames = [
            'gradle/wrapper/gradle-wrapper.properties',
            'gradle/wrapper/gradle-wrapper.jar',
            'gradlew',
            'gradlew.bat',
        ].map((filename) => packageFileName
            .replace('gradle/wrapper/', '')
            .replace('gradle-wrapper.properties', '') + filename);
        const updateArtifactsResult = (await Promise.all(artifactFileNames.map((fileProjectPath) => addIfUpdated(status, fileProjectPath)))).filter((e) => e != null);
        logger_1.logger.debug({ files: updateArtifactsResult.map((r) => r.file.name) }, `Returning updated gradle-wrapper files`);
        return updateArtifactsResult;
    }
    catch (err) {
        logger_1.logger.debug({ err }, 'Error setting new Gradle Wrapper release value');
        return [
            {
                artifactError: {
                    lockFile: packageFileName,
                    stderr: err.message,
                },
            },
        ];
    }
}
exports.updateArtifacts = updateArtifacts;
//# sourceMappingURL=artifacts.js.map