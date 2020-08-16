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
exports.analyseTerraformModule = exports.extractTerraformModule = void 0;
const datasourceGitTags = __importStar(require("../../datasource/git-tags"));
const datasourceGithubTags = __importStar(require("../../datasource/github-tags"));
const datasourceTerraformModule = __importStar(require("../../datasource/terraform-module"));
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const hashicorp_1 = require("../../versioning/hashicorp");
const providers_1 = require("./providers");
const util_1 = require("./util");
const githubRefMatchRegex = /github.com([/:])(?<project>[^/]+\/[a-z0-9-.]+).*\?ref=(?<tag>.*)$/;
const gitTagsRefMatchRegex = /(?:git::)?(?<url>(?:http|https|ssh):\/\/(?:.*@)?(?<path>.*.*\/(?<project>.*\/.*)))\?ref=(?<tag>.*)$/;
const hostnameMatchRegex = /^(?<hostname>([\w|\d]+\.)+[\w|\d]+)/;
function extractTerraformModule(startingLine, lines, moduleName) {
    const result = providers_1.extractTerraformProvider(startingLine, lines, moduleName);
    result.dependencies.forEach((dep) => {
        // eslint-disable-next-line no-param-reassign
        dep.managerData.terraformDependencyType = util_1.TerraformDependencyTypes.module;
    });
    return result;
}
exports.extractTerraformModule = extractTerraformModule;
function analyseTerraformModule(dep) {
    const githubRefMatch = githubRefMatchRegex.exec(dep.managerData.source);
    const gitTagsRefMatch = gitTagsRefMatchRegex.exec(dep.managerData.source);
    /* eslint-disable no-param-reassign */
    if (githubRefMatch) {
        const depNameShort = githubRefMatch.groups.project.replace(/\.git$/, '');
        dep.depType = 'github';
        dep.depName = 'github.com/' + depNameShort;
        dep.depNameShort = depNameShort;
        dep.currentValue = githubRefMatch.groups.tag;
        dep.datasource = datasourceGithubTags.id;
        dep.lookupName = depNameShort;
        if (!hashicorp_1.isVersion(dep.currentValue)) {
            dep.skipReason = types_1.SkipReason.UnsupportedVersion;
        }
    }
    else if (gitTagsRefMatch) {
        dep.depType = 'gitTags';
        if (gitTagsRefMatch.groups.path.includes('//')) {
            logger_1.logger.debug('Terraform module contains subdirectory');
            dep.depName = gitTagsRefMatch.groups.path.split('//')[0];
            dep.depNameShort = dep.depName.split(/\/(.+)/)[1];
            const tempLookupName = gitTagsRefMatch.groups.url.split('//');
            dep.lookupName = tempLookupName[0] + '//' + tempLookupName[1];
        }
        else {
            dep.depName = gitTagsRefMatch.groups.path.replace('.git', '');
            dep.depNameShort = gitTagsRefMatch.groups.project.replace('.git', '');
            dep.lookupName = gitTagsRefMatch.groups.url;
        }
        dep.currentValue = gitTagsRefMatch.groups.tag;
        dep.datasource = datasourceGitTags.id;
        if (!hashicorp_1.isVersion(dep.currentValue)) {
            dep.skipReason = types_1.SkipReason.UnsupportedVersion;
        }
    }
    else if (dep.managerData.source) {
        const moduleParts = dep.managerData.source.split('//')[0].split('/');
        if (moduleParts[0] === '..') {
            dep.skipReason = types_1.SkipReason.Local;
        }
        else if (moduleParts.length >= 3) {
            const hostnameMatch = hostnameMatchRegex.exec(dep.managerData.source);
            if (hostnameMatch) {
                dep.registryUrls = [`https://${hostnameMatch.groups.hostname}`];
            }
            dep.depType = 'terraform';
            dep.depName = moduleParts.join('/');
            dep.depNameShort = dep.depName;
            dep.datasource = datasourceTerraformModule.id;
        }
    }
    else {
        logger_1.logger.debug({ dep }, 'terraform dep has no source');
        dep.skipReason = types_1.SkipReason.NoSource;
    }
    /* eslint-enable no-param-reassign */
}
exports.analyseTerraformModule = analyseTerraformModule;
//# sourceMappingURL=modules.js.map