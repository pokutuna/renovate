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
exports.extractPackageFile = void 0;
const datasourceClojure = __importStar(require("../../datasource/clojure"));
const extract_1 = require("../leiningen/extract");
function extractPackageFile(content) {
    const deps = [];
    const regex = /([^{\s,]*)[\s,]*{[\s,]*:mvn\/version[\s,]+"([^"]+)"[\s,]*}/;
    let rest = content;
    let match = regex.exec(rest);
    let offset = 0;
    while (match) {
        const [wholeSubstr, depName, currentValue] = match;
        offset += match.index + wholeSubstr.length;
        rest = content.slice(offset);
        match = regex.exec(rest);
        deps.push({
            datasource: datasourceClojure.id,
            depName: extract_1.expandDepName(depName),
            currentValue,
            registryUrls: [],
        });
    }
    return { deps };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map