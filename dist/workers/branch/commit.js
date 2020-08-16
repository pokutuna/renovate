"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitFilesToBranch = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const minimatch_1 = __importDefault(require("minimatch"));
const error_messages_1 = require("../../constants/error-messages");
const logger_1 = require("../../logger");
const git_1 = require("../../util/git");
const sanitize_1 = require("../../util/sanitize");
function commitFilesToBranch(config) {
    let updatedFiles = config.updatedPackageFiles.concat(config.updatedArtifacts);
    // istanbul ignore if
    if (is_1.default.nonEmptyArray(config.excludeCommitPaths)) {
        updatedFiles = updatedFiles.filter((f) => {
            const filename = f.name === '|delete|' ? f.contents.toString() : f.name;
            const matchesExcludePaths = config.excludeCommitPaths.some((path) => minimatch_1.default(filename, path, { dot: true }));
            if (matchesExcludePaths) {
                logger_1.logger.debug(`Excluding ${filename} from commit`);
                return false;
            }
            return true;
        });
    }
    if (!is_1.default.nonEmptyArray(updatedFiles)) {
        logger_1.logger.debug(`No files to commit`);
        return null;
    }
    const fileLength = [...new Set(updatedFiles.map((file) => file.name))].length;
    logger_1.logger.debug(`${fileLength} file(s) to commit`);
    // istanbul ignore if
    if (config.dryRun) {
        logger_1.logger.info('DRY-RUN: Would commit files to branch ' + config.branchName);
        return null;
    }
    // istanbul ignore if
    if (config.branchName !== sanitize_1.sanitize(config.branchName) ||
        config.commitMessage !== sanitize_1.sanitize(config.commitMessage)) {
        throw new Error(error_messages_1.CONFIG_SECRETS_EXPOSED);
    }
    // API will know whether to create new branch or not
    return git_1.commitFiles({
        branchName: config.branchName,
        files: updatedFiles,
        message: config.commitMessage,
        force: !!config.forceCommit,
    });
}
exports.commitFilesToBranch = commitFilesToBranch;
//# sourceMappingURL=commit.js.map