"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMatchingFiles = exports.getFilteredFileList = exports.filterIgnoredFiles = exports.getIncludedFiles = void 0;
const minimatch_1 = __importDefault(require("minimatch"));
const logger_1 = require("../../../logger");
const git_1 = require("../../../util/git");
const regex_1 = require("../../../util/regex");
function getIncludedFiles(fileList, includePaths) {
    if (!(includePaths === null || includePaths === void 0 ? void 0 : includePaths.length)) {
        return [...fileList];
    }
    return fileList.filter((file) => includePaths.some((includePath) => file === includePath || minimatch_1.default(file, includePath, { dot: true })));
}
exports.getIncludedFiles = getIncludedFiles;
function filterIgnoredFiles(fileList, ignorePaths) {
    if (!(ignorePaths === null || ignorePaths === void 0 ? void 0 : ignorePaths.length)) {
        return [...fileList];
    }
    return fileList.filter((file) => !ignorePaths.some((ignorePath) => file.includes(ignorePath) ||
        minimatch_1.default(file, ignorePath, { dot: true })));
}
exports.filterIgnoredFiles = filterIgnoredFiles;
function getFilteredFileList(config, fileList) {
    const { includePaths, ignorePaths } = config;
    let filteredList = getIncludedFiles(fileList, includePaths);
    filteredList = filterIgnoredFiles(filteredList, ignorePaths);
    return filteredList;
}
exports.getFilteredFileList = getFilteredFileList;
async function getMatchingFiles(config) {
    const allFiles = await git_1.getFileList();
    const fileList = getFilteredFileList(config, allFiles);
    const { fileMatch, manager } = config;
    let matchedFiles = [];
    for (const match of fileMatch) {
        logger_1.logger.debug(`Using file match: ${match} for manager ${manager}`);
        const re = regex_1.regEx(match);
        matchedFiles = matchedFiles.concat(fileList.filter((file) => re.test(file)));
    }
    // filter out duplicates
    return [...new Set(matchedFiles)];
}
exports.getMatchingFiles = getMatchingFiles;
//# sourceMappingURL=file-match.js.map