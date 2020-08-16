"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceAt = exports.matchAt = void 0;
const logger_1 = require("../logger");
// Return true if the match string is found at index in content
function matchAt(content, index, match) {
    return content.substring(index, index + match.length) === match;
}
exports.matchAt = matchAt;
// Replace oldString with newString at location index of content
function replaceAt(content, index, oldString, newString) {
    logger_1.logger.trace(`Replacing ${oldString} with ${newString} at index ${index}`);
    return (content.substr(0, index) +
        newString +
        content.substr(index + oldString.length));
}
exports.replaceAt = replaceAt;
//# sourceMappingURL=string.js.map