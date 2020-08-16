"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateArtifacts = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const logger_1 = require("../../logger");
const exec_1 = require("../../util/exec");
const fs_1 = require("../../util/fs");
async function updateArtifacts({ packageFileName, updatedDeps, newPackageFileContent, config, }) {
    logger_1.logger.debug(`pip_requirements.updateArtifacts(${packageFileName})`);
    if (!is_1.default.nonEmptyArray(updatedDeps)) {
        logger_1.logger.debug('No updated pip_requirements deps - returning null');
        return null;
    }
    try {
        const cmd = [];
        const rewrittenContent = newPackageFileContent.replace(/\\\n/g, '');
        const lines = rewrittenContent.split('\n').map((line) => line.trim());
        for (const dep of updatedDeps) {
            const hashLine = lines.find((line) => line.startsWith(`${dep}==`) && line.includes('--hash='));
            if (hashLine) {
                const depConstraint = hashLine.split(' ')[0];
                cmd.push(`hashin ${depConstraint} -r ${packageFileName}`);
            }
        }
        const execOptions = {
            cwdFile: '.',
            docker: {
                image: 'renovate/python',
                tagScheme: 'pip_requirements',
                preCommands: ['pip install hashin'],
            },
        };
        await exec_1.exec(cmd, execOptions);
        const newContent = await fs_1.readLocalFile(packageFileName, 'utf8');
        if (newContent === newPackageFileContent) {
            logger_1.logger.debug(`${packageFileName} is unchanged`);
            return null;
        }
        logger_1.logger.debug(`Returning updated ${packageFileName}`);
        return [
            {
                file: {
                    name: packageFileName,
                    contents: newContent,
                },
            },
        ];
    }
    catch (err) {
        logger_1.logger.debug({ err }, `Failed to update ${packageFileName} file`);
        return [
            {
                artifactError: {
                    lockFile: packageFileName,
                    stderr: `${err.stdout}\n${err.stderr}`,
                },
            },
        ];
    }
}
exports.updateArtifacts = updateArtifacts;
//# sourceMappingURL=artifacts.js.map