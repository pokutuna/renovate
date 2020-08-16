"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = exports.extractPackageFile = void 0;
const extract_1 = __importDefault(require("./extract"));
exports.extractPackageFile = extract_1.default;
exports.defaultConfig = {
    fileMatch: ['(^|/)requirements\\.ya?ml$'],
};
//# sourceMappingURL=index.js.map