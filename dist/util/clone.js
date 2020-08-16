"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clone = void 0;
const fast_safe_stringify_1 = __importDefault(require("fast-safe-stringify"));
function clone(input = null) {
    return JSON.parse(fast_safe_stringify_1.default(input));
}
exports.clone = clone;
//# sourceMappingURL=clone.js.map