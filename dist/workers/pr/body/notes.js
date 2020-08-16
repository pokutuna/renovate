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
exports.getPrExtraNotes = exports.getPrNotes = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const logger_1 = require("../../../logger");
const emoji_1 = require("../../../util/emoji");
const template = __importStar(require("../../../util/template"));
function getPrNotes(config) {
    const notes = [];
    for (const upgrade of config.upgrades) {
        if (is_1.default.nonEmptyArray(upgrade.prBodyNotes)) {
            for (const note of upgrade.prBodyNotes) {
                try {
                    const res = template.compile(note, upgrade).trim();
                    if (res === null || res === void 0 ? void 0 : res.length) {
                        notes.push(res);
                    }
                }
                catch (err) {
                    logger_1.logger.warn({ note }, 'Error compiling upgrade note');
                }
            }
        }
    }
    const uniqueNotes = [...new Set(notes)];
    return uniqueNotes.join('\n\n') + '\n\n';
}
exports.getPrNotes = getPrNotes;
function getPrExtraNotes(config) {
    let res = '';
    if (config.upgrades.some((upgrade) => upgrade.gitRef)) {
        res += emoji_1.emojify(':abcd: If you wish to disable git hash updates, add `":disableDigestUpdates"` to the extends array in your config.\n\n');
    }
    if (config.updateType === 'lockFileMaintenance') {
        res += emoji_1.emojify(':wrench: This Pull Request updates lock files to use the latest dependency versions.\n\n');
    }
    if (config.isPin) {
        res += emoji_1.emojify(`:pushpin: **Important**: Renovate will wait until you have merged this Pin PR before creating any *upgrade* PRs for the affected packages. Add the preset \`:preserveSemverRanges\` to your config if you instead don't wish to pin dependencies.\n\n`);
    }
    return res;
}
exports.getPrExtraNotes = getPrExtraNotes;
//# sourceMappingURL=notes.js.map