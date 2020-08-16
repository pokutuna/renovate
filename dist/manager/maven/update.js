"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDependency = exports.updateAtPosition = void 0;
const logger_1 = require("../../logger");
function updateAtPosition(fileContent, upgrade, endingAnchor) {
    const { depName, currentValue, newValue, fileReplacePosition } = upgrade;
    const leftPart = fileContent.slice(0, fileReplacePosition);
    const rightPart = fileContent.slice(fileReplacePosition);
    const versionClosePosition = rightPart.indexOf(endingAnchor);
    const restPart = rightPart.slice(versionClosePosition);
    const versionPart = rightPart.slice(0, versionClosePosition);
    const version = versionPart.trim();
    if (version === newValue) {
        return fileContent;
    }
    if (version === currentValue || upgrade.groupName) {
        const replacedPart = versionPart.replace(version, newValue);
        return leftPart + replacedPart + restPart;
    }
    logger_1.logger.debug({ depName, version, currentValue, newValue }, 'Unknown value');
    return null;
}
exports.updateAtPosition = updateAtPosition;
function updateDependency({ fileContent, upgrade, }) {
    const offset = fileContent.indexOf('<');
    const spaces = fileContent.slice(0, offset);
    const restContent = fileContent.slice(offset);
    const updatedContent = updateAtPosition(restContent, upgrade, '</');
    if (!updatedContent) {
        return null;
    }
    if (updatedContent === restContent) {
        return fileContent;
    }
    return `${spaces}${updatedContent}`;
}
exports.updateDependency = updateDependency;
//# sourceMappingURL=update.js.map