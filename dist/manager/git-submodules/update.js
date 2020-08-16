"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const simple_git_1 = __importDefault(require("simple-git"));
async function updateDependency({ fileContent, upgrade, }) {
    const git = simple_git_1.default(upgrade.localDir);
    try {
        await git.raw([
            'submodule',
            'update',
            '--init',
            '--remote',
            upgrade.depName,
        ]);
        return fileContent;
    }
    catch (err) {
        return null;
    }
}
exports.default = updateDependency;
//# sourceMappingURL=update.js.map