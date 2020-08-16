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
exports.extractPackageFile = exports.extractFromVectors = exports.expandDepName = exports.trimAtKey = void 0;
const datasourceClojure = __importStar(require("../../datasource/clojure"));
function trimAtKey(str, kwName) {
    const regex = new RegExp(`:${kwName}(?=\\s)`);
    const keyOffset = str.search(regex);
    if (keyOffset < 0) {
        return null;
    }
    const withSpaces = str.slice(keyOffset + kwName.length + 1);
    const valueOffset = withSpaces.search(/[^\s]/);
    if (valueOffset < 0) {
        return null;
    }
    return withSpaces.slice(valueOffset);
}
exports.trimAtKey = trimAtKey;
function expandDepName(name) {
    return !name.includes('/') ? `${name}:${name}` : name.replace('/', ':');
}
exports.expandDepName = expandDepName;
function extractFromVectors(str, offset = 0, ctx = {}) {
    if (!str.startsWith('[')) {
        return [];
    }
    let balance = 0;
    const result = [];
    let idx = 0;
    let vecPos = 0;
    let artifactId = '';
    let version = '';
    let fileReplacePosition = null;
    const isSpace = (ch) => ch && /[\s,]/.test(ch);
    const cleanStrLiteral = (s) => s.replace(/^"/, '').replace(/"$/, '');
    const yieldDep = () => {
        if (artifactId && version && fileReplacePosition) {
            result.push({
                ...ctx,
                datasource: datasourceClojure.id,
                depName: expandDepName(cleanStrLiteral(artifactId)),
                currentValue: cleanStrLiteral(version),
            });
        }
        artifactId = '';
        version = '';
    };
    let prevChar = null;
    while (idx < str.length) {
        const char = str.charAt(idx);
        if (char === '[') {
            balance += 1;
            if (balance === 2) {
                vecPos = 0;
            }
        }
        else if (char === ']') {
            balance -= 1;
            if (balance === 1) {
                yieldDep();
            }
            else if (balance === 0) {
                break;
            }
        }
        else if (balance === 2) {
            if (isSpace(char)) {
                if (!isSpace(prevChar)) {
                    vecPos += 1;
                }
            }
            else if (vecPos === 0) {
                artifactId += char;
            }
            else if (vecPos === 1) {
                if (isSpace(prevChar)) {
                    fileReplacePosition = offset + idx + 1;
                }
                version += char;
            }
        }
        prevChar = char;
        idx += 1;
    }
    return result;
}
exports.extractFromVectors = extractFromVectors;
function extractLeinRepos(content) {
    const result = [];
    const repoContent = trimAtKey(content.replace(/;;.*(?=[\r\n])/g, ''), // get rid of comments
    'repositories');
    if (repoContent) {
        let balance = 0;
        let endIdx = 0;
        for (let idx = 0; idx < repoContent.length; idx += 1) {
            const char = repoContent.charAt(idx);
            if (char === '[') {
                balance += 1;
            }
            else if (char === ']') {
                balance -= 1;
                if (balance <= 0) {
                    endIdx = idx;
                    break;
                }
            }
        }
        const repoSectionContent = repoContent.slice(0, endIdx);
        const matches = repoSectionContent.match(/"https?:\/\/[^"]*"/g) || [];
        const urls = matches.map((x) => x.replace(/^"/, '').replace(/"$/, ''));
        urls.forEach((url) => result.push(url));
    }
    return result;
}
function extractPackageFile(content) {
    const collect = (key, ctx) => {
        let result = [];
        let restContent = trimAtKey(content, key);
        while (restContent) {
            const offset = content.length - restContent.length;
            result = [...result, ...extractFromVectors(restContent, offset, ctx)];
            restContent = trimAtKey(restContent, key);
        }
        return result;
    };
    const registryUrls = extractLeinRepos(content);
    const deps = [
        ...collect('dependencies', {
            depType: 'dependencies',
            registryUrls,
        }),
        ...collect('managed-dependencies', {
            depType: 'managed-dependencies',
            registryUrls,
        }),
        ...collect('dev-dependencies', {
            depType: 'managed-dependencies',
            registryUrls,
        }),
        ...collect('plugins', {
            depType: 'plugins',
            registryUrls,
        }),
        ...collect('pom-plugins', {
            depType: 'pom-plugins',
            registryUrls,
        }),
    ];
    return { deps };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map