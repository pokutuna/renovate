"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.isValid = exports.supportsRanges = exports.urls = exports.displayName = exports.id = void 0;
const npm_1 = __importStar(require("../npm"));
Object.defineProperty(exports, "isValid", { enumerable: true, get: function () { return npm_1.isValid; } });
exports.id = 'node';
exports.displayName = 'Node.js';
exports.urls = [];
exports.supportsRanges = false;
function getNewValue({ currentValue, rangeStrategy, fromVersion, toVersion, }) {
    const res = npm_1.default.getNewValue({
        currentValue,
        rangeStrategy,
        fromVersion,
        toVersion,
    });
    if (npm_1.isVersion(res)) {
        // normalize out any 'v' prefix
        return npm_1.isVersion(res);
    }
    return res;
}
exports.api = {
    ...npm_1.default,
    getNewValue,
};
exports.default = exports.api;
//# sourceMappingURL=index.js.map