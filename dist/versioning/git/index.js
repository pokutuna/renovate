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
exports.api = exports.supportsRanges = exports.urls = exports.displayName = exports.id = void 0;
const generic = __importStar(require("../loose/generic"));
exports.id = 'git';
exports.displayName = 'git';
exports.urls = ['https://git-scm.com/'];
exports.supportsRanges = false;
const parse = (version) => ({ release: [parseInt(version, 10)] });
const isCompatible = (version, range) => true;
const compare = (version1, version2) => -1;
const valueToVersion = (value) => value;
exports.api = {
    ...generic.create({
        parse,
        compare,
    }),
    isCompatible,
    valueToVersion,
};
exports.default = exports.api;
//# sourceMappingURL=index.js.map