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
exports.extractPackageFile = exports.extractDep = void 0;
const datasourceCdnjs = __importStar(require("../../datasource/cdnjs"));
const extract_1 = require("../cdnurl/extract");
const regex = /<\s*(script|link)\s+[^>]*?\/?>/i;
const integrityRegex = /\s+integrity\s*=\s*("|')(?<currentDigest>[^"']+)/;
function extractDep(tag) {
    const match = extract_1.cloudflareUrlRegex.exec(tag);
    if (!match) {
        return null;
    }
    const { depName, currentValue, asset } = match.groups;
    const dep = {
        datasource: datasourceCdnjs.id,
        depName,
        lookupName: `${depName}/${asset}`,
        currentValue,
        replaceString: tag,
    };
    const integrityMatch = integrityRegex.exec(tag);
    if (integrityMatch) {
        dep.currentDigest = integrityMatch.groups.currentDigest;
    }
    return dep;
}
exports.extractDep = extractDep;
function extractPackageFile(content) {
    const deps = [];
    let rest = content;
    let match = regex.exec(rest);
    let offset = 0;
    while (match) {
        const [replaceString] = match;
        offset += match.index + replaceString.length;
        rest = content.slice(offset);
        match = regex.exec(rest);
        const dep = extractDep(replaceString);
        if (dep) {
            deps.push(dep);
        }
    }
    if (!deps.length) {
        return null;
    }
    return { deps };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map