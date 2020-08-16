"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emojify = exports.setEmojiConfig = void 0;
const node_emoji_1 = __importDefault(require("node-emoji"));
let unicodeEmoji = false;
function setEmojiConfig(_config) {
    unicodeEmoji = _config.unicodeEmoji;
}
exports.setEmojiConfig = setEmojiConfig;
function emojify(text) {
    return unicodeEmoji ? node_emoji_1.default.emojify(text) : text;
}
exports.emojify = emojify;
//# sourceMappingURL=emoji.js.map