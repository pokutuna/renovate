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
const datasourceMaven = __importStar(require("../../datasource/maven"));
const common_1 = require("../../datasource/maven/common");
const datasourceSbtPackage = __importStar(require("../../datasource/sbt-package"));
const datasourceSbtPlugin = __importStar(require("../../datasource/sbt-plugin"));
const versioning_1 = require("../../versioning");
const mavenVersioning = __importStar(require("../../versioning/maven"));
const stripComment = (str) => str.replace(/(^|\s+)\/\/.*$/, '');
const isSingleLineDep = (str) => /^\s*(libraryDependencies|dependencyOverrides)\s*\+=\s*/.test(str);
const isDepsBegin = (str) => /^\s*(libraryDependencies|dependencyOverrides)\s*\+\+=\s*/.test(str);
const isPluginDep = (str) => /^\s*addSbtPlugin\s*\(.*\)\s*$/.test(str);
const isStringLiteral = (str) => /^"[^"]*"$/.test(str);
const isScalaVersion = (str) => /^\s*scalaVersion\s*:=\s*"[^"]*"[\s,]*$/.test(str);
const getScalaVersion = (str) => str.replace(/^\s*scalaVersion\s*:=\s*"/, '').replace(/"[\s,]*$/, '');
/*
  https://www.scala-sbt.org/release/docs/Cross-Build.html#Publishing+conventions
 */
const normalizeScalaVersion = (str) => {
    // istanbul ignore if
    if (!str) {
        return str;
    }
    const versioning = versioning_1.get(mavenVersioning.id);
    if (versioning.isVersion(str)) {
        // Do not normalize unstable versions
        if (!versioning.isStable(str)) {
            return str;
        }
        // Do not normalize versions prior to 2.10
        if (!versioning.isGreaterThan(str, '2.10.0')) {
            return str;
        }
    }
    if (/^\d+\.\d+\.\d+$/.test(str)) {
        return str.replace(/^(\d+)\.(\d+)\.\d+$/, '$1.$2');
    }
    // istanbul ignore next
    return str;
};
const isScalaVersionVariable = (str) => /^\s*scalaVersion\s*:=\s*[_a-zA-Z][_a-zA-Z0-9]*[\s,]*$/.test(str);
const getScalaVersionVariable = (str) => str.replace(/^\s*scalaVersion\s*:=\s*/, '').replace(/[\s,]*$/, '');
const isResolver = (str) => /^\s*(resolvers\s*\+\+?=\s*(Seq\()?)?"[^"]*"\s*at\s*"[^"]*"[\s,)]*$/.test(str);
const getResolverUrl = (str) => str
    .replace(/^\s*(resolvers\s*\+\+?=\s*(Seq\()?)?"[^"]*"\s*at\s*"/, '')
    .replace(/"[\s,)]*$/, '');
const isVarDependency = (str) => /^\s*(private\s*)?(lazy\s*)?val\s[_a-zA-Z][_a-zA-Z0-9]*\s*=.*(%%?).*%.*/.test(str);
const isVarDef = (str) => /^\s*(private\s*)?(lazy\s*)?val\s+[_a-zA-Z][_a-zA-Z0-9]*\s*=\s*"[^"]*"\s*$/.test(str);
const getVarName = (str) => str
    .replace(/^\s*(private\s*)?(lazy\s*)?val\s+/, '')
    .replace(/\s*=\s*"[^"]*"\s*$/, '');
const isVarName = (str) => /^[_a-zA-Z][_a-zA-Z0-9]*$/.test(str);
const getVarInfo = (str, ctx) => {
    const rightPart = str.replace(/^\s*(private\s*)?(lazy\s*)?val\s+[_a-zA-Z][_a-zA-Z0-9]*\s*=\s*"/, '');
    const val = rightPart.replace(/"\s*$/, '');
    return { val };
};
function parseDepExpr(expr, ctx) {
    const { scalaVersion, variables } = ctx;
    let { depType } = ctx;
    const isValidToken = (str) => isStringLiteral(str) || (isVarName(str) && !!variables[str]);
    const resolveToken = (str) => isStringLiteral(str)
        ? str.replace(/^"/, '').replace(/"$/, '')
        : variables[str].val;
    const tokens = expr
        .trim()
        .replace(/[()]/g, '')
        .split(/\s*(%%?)\s*|\s*classifier\s*/);
    const [rawGroupId, groupOp, rawArtifactId, artifactOp, rawVersion, scopeOp, rawScope,] = tokens;
    if (!rawGroupId) {
        return null;
    }
    if (!isValidToken(rawGroupId)) {
        return null;
    }
    if (!rawArtifactId) {
        return null;
    }
    if (!isValidToken(rawArtifactId)) {
        return null;
    }
    if (artifactOp !== '%') {
        return null;
    }
    if (!rawVersion) {
        return null;
    }
    if (!isValidToken(rawVersion)) {
        return null;
    }
    if (scopeOp && scopeOp !== '%') {
        return null;
    }
    const groupId = resolveToken(rawGroupId);
    const depName = `${groupId}:${resolveToken(rawArtifactId)}`;
    const artifactId = groupOp === '%%' && scalaVersion
        ? `${resolveToken(rawArtifactId)}_${scalaVersion}`
        : resolveToken(rawArtifactId);
    const lookupName = `${groupId}:${artifactId}`;
    const currentValue = resolveToken(rawVersion);
    if (!depType && rawScope) {
        depType = rawScope.replace(/^"/, '').replace(/"$/, '');
    }
    const result = {
        depName,
        lookupName,
        currentValue,
    };
    if (depType) {
        result.depType = depType;
    }
    return result;
}
function parseSbtLine(acc, line, lineIndex, lines) {
    const { deps, registryUrls, variables } = acc;
    let { isMultiDeps, scalaVersion } = acc;
    const ctx = {
        scalaVersion,
        variables,
    };
    let dep = null;
    let scalaVersionVariable = null;
    if (line !== '') {
        if (isScalaVersion(line)) {
            isMultiDeps = false;
            const rawScalaVersion = getScalaVersion(line);
            scalaVersion = normalizeScalaVersion(rawScalaVersion);
            dep = {
                datasource: datasourceMaven.id,
                depName: 'scala',
                lookupName: 'org.scala-lang:scala-library',
                currentValue: rawScalaVersion,
                separateMinorPatch: true,
            };
        }
        else if (isScalaVersionVariable(line)) {
            isMultiDeps = false;
            scalaVersionVariable = getScalaVersionVariable(line);
        }
        else if (isResolver(line)) {
            isMultiDeps = false;
            const url = getResolverUrl(line);
            registryUrls.push(url);
        }
        else if (isVarDef(line)) {
            variables[getVarName(line)] = getVarInfo(line, ctx);
        }
        else if (isVarDependency(line)) {
            isMultiDeps = false;
            const depExpr = line.replace(/^\s*(private\s*)?(lazy\s*)?val\s[_a-zA-Z][_a-zA-Z0-9]*\s*=\s*/, '');
            dep = parseDepExpr(depExpr, {
                ...ctx,
            });
        }
        else if (isSingleLineDep(line)) {
            isMultiDeps = false;
            const depExpr = line.replace(/^.*\+=\s*/, '');
            dep = parseDepExpr(depExpr, {
                ...ctx,
            });
        }
        else if (isPluginDep(line)) {
            isMultiDeps = false;
            const rightPart = line.replace(/^\s*addSbtPlugin\s*\(/, '');
            const depExpr = rightPart.replace(/\)\s*$/, '');
            dep = parseDepExpr(depExpr, {
                ...ctx,
                depType: 'plugin',
            });
        }
        else if (isDepsBegin(line)) {
            isMultiDeps = true;
        }
        else if (isMultiDeps) {
            const rightPart = line.replace(/^[\s,]*/, '');
            const depExpr = rightPart.replace(/[\s,]*$/, '');
            dep = parseDepExpr(depExpr, {
                ...ctx,
            });
        }
    }
    if (dep) {
        if (!dep.datasource) {
            if (dep.depType === 'plugin') {
                dep.datasource = datasourceSbtPlugin.id;
            }
            else {
                dep.datasource = datasourceSbtPackage.id;
            }
        }
        deps.push({
            registryUrls,
            ...dep,
        });
    }
    if (lineIndex + 1 < lines.length) {
        return {
            ...acc,
            isMultiDeps,
            scalaVersion: scalaVersion ||
                (scalaVersionVariable &&
                    variables[scalaVersionVariable] &&
                    normalizeScalaVersion(variables[scalaVersionVariable].val)),
        };
    }
    if (deps.length) {
        return { deps };
    }
    return null;
}
function extractPackageFile(content) {
    if (!content) {
        return null;
    }
    const lines = content.split(/\n/).map(stripComment);
    return lines.reduce(parseSbtLine, {
        registryUrls: [common_1.MAVEN_REPO],
        deps: [],
        isMultiDeps: false,
        scalaVersion: null,
        variables: {},
    });
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map