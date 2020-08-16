"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// istanbul ignore next
function default_1(cmd) {
    if (typeof cmd === 'string') {
        return cmd.replace(/https:\/\/[^@]*@/g, 'https://**redacted**@');
    }
    return cmd;
}
exports.default = default_1;
//# sourceMappingURL=cmd-serializer.js.map