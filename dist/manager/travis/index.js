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
exports.defaultConfig = exports.language = void 0;
const languages_1 = require("../../constants/languages");
const nodeVersioning = __importStar(require("../../versioning/node"));
var extract_1 = require("./extract");
Object.defineProperty(exports, "extractPackageFile", { enumerable: true, get: function () { return extract_1.extractPackageFile; } });
var package_1 = require("./package");
Object.defineProperty(exports, "getPackageUpdates", { enumerable: true, get: function () { return package_1.getPackageUpdates; } });
var update_1 = require("./update");
Object.defineProperty(exports, "updateDependency", { enumerable: true, get: function () { return update_1.updateDependency; } });
exports.language = languages_1.LANGUAGE_NODE;
exports.defaultConfig = {
    fileMatch: ['^.travis.yml$'],
    versioning: nodeVersioning.id,
};
//# sourceMappingURL=index.js.map