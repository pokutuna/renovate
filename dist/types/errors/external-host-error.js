"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalHostError = void 0;
const error_messages_1 = require("../../constants/error-messages");
class ExternalHostError extends Error {
    constructor(err, hostType) {
        super(error_messages_1.EXTERNAL_HOST_ERROR);
        // Set the prototype explicitly: https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, ExternalHostError.prototype);
        this.hostType = hostType;
        this.err = err;
    }
}
exports.ExternalHostError = ExternalHostError;
//# sourceMappingURL=external-host-error.js.map