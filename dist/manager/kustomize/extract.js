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
exports.extractPackageFile = exports.parseKustomize = exports.extractImage = exports.extractBase = void 0;
const js_yaml_1 = require("js-yaml");
const datasourceDocker = __importStar(require("../../datasource/docker"));
const datasourceGitTags = __importStar(require("../../datasource/git-tags"));
const datasourceGitHubTags = __importStar(require("../../datasource/github-tags"));
const logger_1 = require("../../logger");
// extract the version from the url
const versionMatch = /(?<basename>.*)\?ref=(?<version>.*)\s*$/;
// extract the url from the base of a url with a subdir
const extractUrl = /^(?<url>.*)(?:\/\/.*)$/;
const githubUrl = /^github\.com\/(?<depName>(?<lookupName>[^/]+?\/[^/]+?)(?:\/[^/]+?)*)\?ref=(?<currentValue>.+)$/;
function extractBase(base) {
    const githubMatch = githubUrl.exec(base);
    if (githubMatch === null || githubMatch === void 0 ? void 0 : githubMatch.groups) {
        const { currentValue, depName, lookupName } = githubMatch.groups;
        return {
            datasource: datasourceGitHubTags.id,
            depName,
            lookupName,
            currentValue,
        };
    }
    const basenameVersion = versionMatch.exec(base);
    if (basenameVersion) {
        const currentValue = basenameVersion.groups.version;
        const root = basenameVersion.groups.basename;
        const urlResult = extractUrl.exec(root);
        let url = root;
        // if a match, then there was a subdir, update
        if (urlResult && !url.startsWith('http')) {
            url = urlResult.groups.url;
        }
        return {
            datasource: datasourceGitTags.id,
            depName: root,
            lookupName: url,
            currentValue,
        };
    }
    return null;
}
exports.extractBase = extractBase;
function extractImage(image) {
    if ((image === null || image === void 0 ? void 0 : image.name) && image.newTag) {
        return {
            datasource: datasourceDocker.id,
            depName: image.name,
            lookupName: image.name,
            currentValue: image.newTag,
        };
    }
    return null;
}
exports.extractImage = extractImage;
function parseKustomize(content) {
    let pkg = null;
    try {
        pkg = js_yaml_1.safeLoad(content);
    }
    catch (e) /* istanbul ignore next */ {
        return null;
    }
    if (!pkg) {
        return null;
    }
    if (pkg.kind !== 'Kustomization') {
        return null;
    }
    pkg.bases = (pkg.bases || []).concat(pkg.resources || []);
    pkg.images = pkg.images || [];
    return pkg;
}
exports.parseKustomize = parseKustomize;
function extractPackageFile(content) {
    logger_1.logger.trace('kustomize.extractPackageFile()');
    const deps = [];
    const pkg = parseKustomize(content);
    if (!pkg) {
        return null;
    }
    // grab the remote bases
    for (const base of pkg.bases) {
        const dep = extractBase(base);
        if (dep) {
            deps.push(dep);
        }
    }
    // grab the image tags
    for (const image of pkg.images) {
        const dep = extractImage(image);
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