"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.embedChangelogs = void 0;
const p_map_1 = __importDefault(require("p-map"));
const changelog_1 = require("../../pr/changelog");
// istanbul ignore next
async function embedChangelog(upgrade) {
    upgrade.logJSON = await changelog_1.getChangeLogJSON(upgrade); // eslint-disable-line
}
// istanbul ignore next
async function embedChangelogs(branchUpgrades) {
    const upgrades = [];
    for (const branchName of Object.keys(branchUpgrades)) {
        for (const upgrade of branchUpgrades[branchName]) {
            upgrades.push(upgrade);
        }
    }
    await p_map_1.default(upgrades, embedChangelog, { concurrency: 10 });
}
exports.embedChangelogs = embedChangelogs;
//# sourceMappingURL=index.js.map