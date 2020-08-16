"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const is_1 = __importDefault(require("@sindresorhus/is"));
Error.stackTraceLimit = 20;
// TODO: remove any type
function errSerializer(err) {
    var _a;
    const response = {
        ...err,
    };
    if (err.body) {
        response.body = err.body;
    }
    else if ((_a = err.response) === null || _a === void 0 ? void 0 : _a.body) {
        response.body = err.response.body;
    }
    if (err.message) {
        response.message = err.message;
    }
    if (err.stack) {
        response.stack = err.stack;
    }
    if (response.gotOptions) {
        if (is_1.default.string(response.gotOptions.auth)) {
            response.gotOptions.auth = response.gotOptions.auth.replace(/:.*/, ':***********');
        }
        if (err.gotOptions.headers) {
            const redactedHeaders = [
                'authorization',
                'private-header',
                'Private-header',
            ];
            redactedHeaders.forEach((header) => {
                if (response.gotOptions.headers[header]) {
                    response.gotOptions.headers[header] = '** redacted **';
                }
            });
        }
    }
    const redactedFields = ['message', 'stack', 'stdout', 'stderr'];
    for (const field of redactedFields) {
        if (is_1.default.string(response[field])) {
            response[field] = response[field].replace(/https:\/\/[^@]*@/g, 'https://**redacted**@');
        }
    }
    return response;
}
exports.default = errSerializer;
//# sourceMappingURL=err-serializer.js.map