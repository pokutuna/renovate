"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readOnlyIssueBody = void 0;
function readOnlyIssueBody(body) {
    return body
        .replace(' only once you click their checkbox below', '')
        .replace(' unless you click a checkbox below', '')
        .replace(' To discard all commits and start over, check the box below.', '')
        .replace(/ Click (?:on |)a checkbox.*\./g, '')
        .replace(/\[ ] <!-- \w*-branch.*-->/g, '');
}
exports.readOnlyIssueBody = readOnlyIssueBody;
exports.default = readOnlyIssueBody;
//# sourceMappingURL=read-only-issue-body.js.map