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
exports.extractPackageFile = exports.cloudflareUrlRegex = void 0;
const datasourceCdnjs = __importStar(require("../../datasource/cdnjs"));
exports.cloudflareUrlRegex = /\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/(?<depName>[^/]+?)\/(?<currentValue>[^/]+?)\/(?<asset>[-/_.a-zA-Z0-9]+)/;
function extractPackageFile(content) {
    const deps = [];
    let rest = content;
    let match = exports.cloudflareUrlRegex.exec(rest);
    let offset = 0;
    while (match) {
        const [wholeSubstr] = match;
        const { depName, currentValue, asset } = match.groups;
        offset += match.index + wholeSubstr.length;
        rest = content.slice(offset);
        match = exports.cloudflareUrlRegex.exec(rest);
        deps.push({
            datasource: datasourceCdnjs.id,
            depName,
            lookupName: `${depName}/${asset}`,
            currentValue,
        });
    }
    return { deps };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map