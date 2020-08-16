"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDependency = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const detect_indent_1 = __importDefault(require("detect-indent"));
const logger_1 = require("../../logger");
function updateDependency({ fileContent, upgrade, }) {
    try {
        logger_1.logger.debug(`travis.updateDependency(): ${upgrade.newValue}`);
        const indent = detect_indent_1.default(fileContent).indent || '  ';
        let quote;
        if (is_1.default.string(upgrade.currentValue[0])) {
            quote =
                fileContent.split(`'`).length > fileContent.split(`"`).length
                    ? `'`
                    : `"`;
        }
        else {
            quote = '';
        }
        let newString = `node_js:\n`;
        // TODO: `newValue` is a string!
        upgrade.newValue.split(',').forEach((version) => {
            newString += `${indent}- ${quote}${version}${quote}\n`;
        });
        return fileContent.replace(/node_js:(\n\s+-[^\n]+)+\n/, newString);
    }
    catch (err) {
        logger_1.logger.debug({ err }, 'Error setting new .travis.yml node versions');
        return null;
    }
}
exports.updateDependency = updateDependency;
//# sourceMappingURL=update.js.map