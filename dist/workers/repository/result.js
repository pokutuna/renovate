"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processResult = void 0;
const error_messages_1 = require("../../constants/error-messages");
function processResult(config, res) {
    const disabledStatuses = [
        error_messages_1.REPOSITORY_ARCHIVED,
        error_messages_1.REPOSITORY_BLOCKED,
        error_messages_1.REPOSITORY_CANNOT_FORK,
        error_messages_1.REPOSITORY_DISABLED,
        error_messages_1.REPOSITORY_ACCESS_FORBIDDEN,
        error_messages_1.REPOSITORY_FORKED,
        error_messages_1.REPOSITORY_MIRRORED,
        error_messages_1.MANAGER_NO_PACKAGE_FILES,
        error_messages_1.REPOSITORY_RENAMED,
        error_messages_1.REPOSITORY_UNINITIATED,
        error_messages_1.REPOSITORY_EMPTY,
    ];
    let status;
    // istanbul ignore next
    if (disabledStatuses.includes(res)) {
        status = 'disabled';
    }
    else if (config.repoIsOnboarded) {
        status = 'enabled';
    }
    else if (config.repoIsOnboarded === false) {
        status = 'onboarding';
    }
    else {
        status = 'unknown';
    }
    return { res, status };
}
exports.processResult = processResult;
//# sourceMappingURL=result.js.map