"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// istanbul ignore file
const types_1 = require("./types");
// TODO: remove when code is refactord
Object.defineProperty(types_1.HttpError.prototype, 'statusCode', {
    get: function statusCode() {
        var _a;
        return (_a = this.response) === null || _a === void 0 ? void 0 : _a.statusCode;
    },
});
Object.defineProperty(types_1.HttpError.prototype, 'body', {
    get: function body() {
        var _a;
        return (_a = this.response) === null || _a === void 0 ? void 0 : _a.body;
    },
    set: function body(value) {
        if (this.response) {
            this.response.body = value;
        }
    },
});
Object.defineProperty(types_1.HttpError.prototype, 'headers', {
    get: function headers() {
        var _a;
        return (_a = this.response) === null || _a === void 0 ? void 0 : _a.headers;
    },
});
Object.defineProperty(types_1.HttpError.prototype, 'url', {
    get: function url() {
        var _a;
        return (_a = this.response) === null || _a === void 0 ? void 0 : _a.url;
    },
});
//# sourceMappingURL=legacy.js.map