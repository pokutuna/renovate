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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAllPackageFiles = exports.resolveParents = exports.extractPackage = exports.parsePom = void 0;
const path_1 = require("path");
const is_1 = __importDefault(require("@sindresorhus/is"));
const xmldoc_1 = require("xmldoc");
const datasourceMaven = __importStar(require("../../datasource/maven"));
const common_1 = require("../../datasource/maven/common");
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const fs_1 = require("../../util/fs");
function parsePom(raw) {
    let project;
    try {
        project = new xmldoc_1.XmlDocument(raw);
    }
    catch (e) {
        return null;
    }
    const { name, attr, children } = project;
    if (name !== 'project') {
        return null;
    }
    if (attr.xmlns === 'http://maven.apache.org/POM/4.0.0') {
        return project;
    }
    if (is_1.default.nonEmptyArray(children) &&
        children.some((c) => c.name === 'modelVersion' && c.val === '4.0.0')) {
        return project;
    }
    return null;
}
exports.parsePom = parsePom;
function containsPlaceholder(str) {
    return /\${.*?}/g.test(str);
}
function depFromNode(node) {
    if (!('valueWithPath' in node)) {
        return null;
    }
    let groupId = node.valueWithPath('groupId');
    const artifactId = node.valueWithPath('artifactId');
    const currentValue = node.valueWithPath('version');
    if (!groupId && node.name === 'plugin') {
        groupId = 'org.apache.maven.plugins';
    }
    if (groupId && artifactId && currentValue) {
        const depName = `${groupId}:${artifactId}`;
        const versionNode = node.descendantWithPath('version');
        const fileReplacePosition = versionNode.position;
        const datasource = datasourceMaven.id;
        const registryUrls = [common_1.MAVEN_REPO];
        return {
            datasource,
            depName,
            currentValue,
            fileReplacePosition,
            registryUrls,
        };
    }
    return null;
}
function deepExtract(node, result = [], isRoot = true) {
    const dep = depFromNode(node);
    if (dep && !isRoot) {
        result.push(dep);
    }
    if (node.children) {
        for (const child of node.children) {
            deepExtract(child, result, false);
        }
    }
    return result;
}
function applyProps(dep, depPackageFile, props) {
    const replaceAll = (str) => str.replace(/\${.*?}/g, (substr) => {
        const propKey = substr.slice(2, -1).trim();
        const propValue = props[propKey];
        return propValue ? propValue.val : substr;
    });
    const depName = replaceAll(dep.depName);
    const registryUrls = dep.registryUrls.map((url) => replaceAll(url));
    let fileReplacePosition = dep.fileReplacePosition;
    let propSource = null;
    let groupName = null;
    const currentValue = dep.currentValue.replace(/^\${.*?}$/, (substr) => {
        const propKey = substr.slice(2, -1).trim();
        const propValue = props[propKey];
        if (propValue) {
            if (!groupName) {
                groupName = propKey;
            }
            fileReplacePosition = propValue.fileReplacePosition;
            propSource = propValue.packageFile;
            return propValue.val;
        }
        return substr;
    });
    const result = {
        ...dep,
        depName,
        registryUrls,
        fileReplacePosition,
        propSource,
        currentValue,
    };
    if (groupName) {
        result.groupName = groupName;
    }
    if (containsPlaceholder(depName)) {
        result.skipReason = types_1.SkipReason.NamePlaceholder;
    }
    else if (containsPlaceholder(currentValue)) {
        result.skipReason = types_1.SkipReason.VersionPlaceholder;
    }
    if (propSource && depPackageFile !== propSource) {
        result.editFile = propSource;
    }
    return result;
}
function resolveParentFile(packageFile, parentPath) {
    let parentFile = 'pom.xml';
    let parentDir = parentPath;
    const parentBasename = path_1.basename(parentPath);
    if (parentBasename === 'pom.xml' || parentBasename.endsWith('.pom.xml')) {
        parentFile = parentBasename;
        parentDir = path_1.dirname(parentPath);
    }
    const dir = path_1.dirname(packageFile);
    return path_1.normalize(path_1.join(dir, parentDir, parentFile));
}
function extractPackage(rawContent, packageFile = null) {
    if (!rawContent) {
        return null;
    }
    const project = parsePom(rawContent);
    if (!project) {
        return null;
    }
    const result = {
        datasource: datasourceMaven.id,
        packageFile,
        deps: [],
    };
    result.deps = deepExtract(project);
    const propsNode = project.childNamed('properties');
    const props = {};
    if (propsNode === null || propsNode === void 0 ? void 0 : propsNode.children) {
        for (const propNode of propsNode.children) {
            const key = propNode.name;
            const val = propNode.val && propNode.val.trim();
            if (key && val) {
                const fileReplacePosition = propNode.position;
                props[key] = { val, fileReplacePosition, packageFile };
            }
        }
    }
    result.mavenProps = props;
    const repositories = project.childNamed('repositories');
    if (repositories === null || repositories === void 0 ? void 0 : repositories.children) {
        const repoUrls = [];
        for (const repo of repositories.childrenNamed('repository')) {
            const repoUrl = repo.valueWithPath('url');
            if (repoUrl) {
                repoUrls.push(repoUrl);
            }
        }
        result.deps.forEach((dep) => {
            if (dep.registryUrls) {
                repoUrls.forEach((url) => dep.registryUrls.push(url));
            }
        });
    }
    if (packageFile && project.childNamed('parent')) {
        const parentPath = project.valueWithPath('parent.relativePath') || '../pom.xml';
        result.parent = resolveParentFile(packageFile, parentPath);
    }
    return result;
}
exports.extractPackage = extractPackage;
function resolveParents(packages) {
    const packageFileNames = [];
    const extractedPackages = {};
    const extractedDeps = {};
    const extractedProps = {};
    const registryUrls = {};
    packages.forEach((pkg) => {
        const name = pkg.packageFile;
        packageFileNames.push(name);
        extractedPackages[name] = pkg;
        extractedDeps[name] = [];
    });
    // Construct package-specific prop scopes
    // and merge them in reverse order,
    // which allows inheritance/overriding.
    packageFileNames.forEach((name) => {
        registryUrls[name] = new Set();
        const propsHierarchy = [];
        const visitedPackages = new Set();
        let pkg = extractedPackages[name];
        while (pkg) {
            propsHierarchy.unshift(pkg.mavenProps);
            if (pkg.deps) {
                pkg.deps.forEach((dep) => {
                    if (dep.registryUrls) {
                        dep.registryUrls.forEach((url) => {
                            registryUrls[name].add(url);
                        });
                    }
                });
            }
            if (pkg.parent && !visitedPackages.has(pkg.parent)) {
                visitedPackages.add(pkg.parent);
                pkg = extractedPackages[pkg.parent];
            }
            else {
                pkg = null;
            }
        }
        propsHierarchy.unshift({});
        extractedProps[name] = Object.assign.apply(null, propsHierarchy);
    });
    // Resolve registryUrls
    packageFileNames.forEach((name) => {
        const pkg = extractedPackages[name];
        pkg.deps.forEach((rawDep) => {
            const urlsSet = new Set([...rawDep.registryUrls, ...registryUrls[name]]);
            rawDep.registryUrls = [...urlsSet]; // eslint-disable-line no-param-reassign
        });
    });
    // Resolve placeholders
    packageFileNames.forEach((name) => {
        const pkg = extractedPackages[name];
        pkg.deps.forEach((rawDep) => {
            const dep = applyProps(rawDep, name, extractedProps[name]);
            const sourceName = dep.propSource || name;
            extractedDeps[sourceName].push(dep);
        });
    });
    return packageFileNames.map((name) => ({
        ...extractedPackages[name],
        deps: extractedDeps[name],
    }));
}
exports.resolveParents = resolveParents;
function cleanResult(packageFiles) {
    packageFiles.forEach((packageFile) => {
        delete packageFile.mavenProps; // eslint-disable-line no-param-reassign
        packageFile.deps.forEach((dep) => {
            delete dep.propSource; // eslint-disable-line no-param-reassign
        });
    });
    return packageFiles;
}
async function extractAllPackageFiles(_config, packageFiles) {
    const packages = [];
    for (const packageFile of packageFiles) {
        const content = await fs_1.readLocalFile(packageFile, 'utf8');
        if (content) {
            const pkg = extractPackage(content, packageFile);
            if (pkg) {
                packages.push(pkg);
            }
            else {
                logger_1.logger.debug({ packageFile }, 'can not read dependencies');
            }
        }
        else {
            logger_1.logger.debug({ packageFile }, 'packageFile has no content');
        }
    }
    return cleanResult(resolveParents(packages));
}
exports.extractAllPackageFiles = extractAllPackageFiles;
//# sourceMappingURL=extract.js.map