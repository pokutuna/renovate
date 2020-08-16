"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.check = void 0;
const manager_1 = require("../../manager");
/**
 * Only if type condition or context condition violated then errors array will be mutated to store metadata
 */
function check({ resolvedRule, currentPath, }) {
    let managersErrMessage;
    if (Array.isArray(resolvedRule.managers)) {
        if (resolvedRule.managers.find((confManager) => !manager_1.getManagerList().includes(confManager))) {
            managersErrMessage = `${currentPath}:
        You have included an unsupported manager in a package rule. Your list: ${resolvedRule.managers}.
        Supported managers are: (${manager_1.getManagerList().join(', ')}).`;
        }
    }
    else if (typeof resolvedRule.managers !== 'undefined') {
        managersErrMessage = `${currentPath}: Managers should be type of List. You have included ${typeof resolvedRule.managers}.`;
    }
    return managersErrMessage
        ? [
            {
                depName: 'Configuration Error',
                message: managersErrMessage,
            },
        ]
        : [];
}
exports.check = check;
//# sourceMappingURL=managers.js.map