"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeOwnersForPr = void 0;
const ignore_1 = __importDefault(require("ignore"));
const logger_1 = require("../../logger");
const fs_1 = require("../../util/fs");
const git_1 = require("../../util/git");
async function codeOwnersForPr(pr) {
    try {
        const codeOwnersFile = (await fs_1.readLocalFile('CODEOWNERS', 'utf8')) ||
            (await fs_1.readLocalFile('.github/CODEOWNERS', 'utf8')) ||
            (await fs_1.readLocalFile('.gitlab/CODEOWNERS', 'utf8')) ||
            (await fs_1.readLocalFile('docs/CODEOWNERS', 'utf8'));
        if (!codeOwnersFile) {
            return [];
        }
        const prFiles = await git_1.getBranchFiles(pr.branchName);
        const rules = codeOwnersFile
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith('#'))
            .map((line) => {
            const [pattern, ...usernames] = line.split(/\s+/);
            return {
                usernames,
                match: (path) => {
                    const matcher = ignore_1.default().add(pattern);
                    return matcher.ignores(path);
                },
            };
        })
            .reverse();
        const matchingRule = rules.find((rule) => prFiles === null || prFiles === void 0 ? void 0 : prFiles.every(rule.match));
        if (!matchingRule) {
            return [];
        }
        return matchingRule.usernames;
    }
    catch (err) {
        logger_1.logger.warn({ err, pr }, 'Failed to determine code owners for PR.');
        return [];
    }
}
exports.codeOwnersForPr = codeOwnersForPr;
//# sourceMappingURL=code-owners.js.map