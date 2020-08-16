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
exports.extractDependenciesFromUpdatesReport = exports.createRenovateGradlePlugin = exports.GRADLE_DEPENDENCY_REPORT_FILENAME = void 0;
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const datasourceSbtPackage = __importStar(require("../../datasource/sbt-package"));
const logger_1 = require("../../logger");
exports.GRADLE_DEPENDENCY_REPORT_FILENAME = 'gradle-renovate-report.json';
async function createRenovateGradlePlugin(localDir) {
    const content = `
import groovy.json.JsonOutput
import org.gradle.api.internal.artifacts.dependencies.DefaultExternalModuleDependency
import java.util.concurrent.ConcurrentLinkedQueue

def output = new ConcurrentLinkedQueue<>();

allprojects {
  tasks.register("renovate") {
    doLast {
      def project = ['project': project.name]
      output << project

      def repos = (repositories + buildscript.repositories + settings.pluginManagement.repositories)
        .findAll { it instanceof MavenArtifactRepository && it.url.scheme ==~ /https?/ }
        .collect { "$it.url" }
        .unique()
      project.repositories = repos

      def deps = (buildscript.configurations + configurations + settings.buildscript.configurations)
        .collect { it.dependencies + it.dependencyConstraints }
        .flatten()
        .findAll { it instanceof DefaultExternalModuleDependency || it instanceof DependencyConstraint }
        .findAll { 'Pinned to the embedded Kotlin' != it.reason } // Embedded Kotlin dependencies
        .collect { ['name':it.name, 'group':it.group, 'version':it.version] }
      project.dependencies = deps
    }
  }
}
gradle.buildFinished {
   def outputFile = new File('${exports.GRADLE_DEPENDENCY_REPORT_FILENAME}')
   def json = JsonOutput.toJson(output)
   outputFile.write json
}`;
    const gradleInitFile = path_1.join(localDir, 'renovate-plugin.gradle');
    logger_1.logger.debug('Creating renovate-plugin.gradle file with renovate gradle plugin');
    await fs_extra_1.writeFile(gradleInitFile, content);
}
exports.createRenovateGradlePlugin = createRenovateGradlePlugin;
async function readGradleReport(localDir) {
    const renovateReportFilename = path_1.join(localDir, exports.GRADLE_DEPENDENCY_REPORT_FILENAME);
    if (!(await fs_extra_1.exists(renovateReportFilename))) {
        return [];
    }
    const contents = await fs_extra_1.readFile(renovateReportFilename, 'utf8');
    try {
        return JSON.parse(contents);
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Invalid JSON');
        return [];
    }
}
function mergeDependenciesWithRepositories(project) {
    if (!project.dependencies) {
        return [];
    }
    return project.dependencies.map((dep) => ({
        ...dep,
        repos: [...project.repositories],
    }));
}
function flatternDependencies(accumulator, currentValue) {
    accumulator.push(...currentValue);
    return accumulator;
}
function combineReposOnDuplicatedDependencies(accumulator, currentValue) {
    const existingDependency = accumulator.find((dep) => dep.name === currentValue.name && dep.group === currentValue.group);
    if (!existingDependency) {
        accumulator.push(currentValue);
    }
    else {
        const nonExistingRepos = currentValue.repos.filter((repo) => !existingDependency.repos.includes(repo));
        existingDependency.repos.push(...nonExistingRepos);
    }
    return accumulator;
}
function buildDependency(gradleModule) {
    return {
        name: gradleModule.name,
        depGroup: gradleModule.group,
        depName: `${gradleModule.group}:${gradleModule.name}`,
        currentValue: gradleModule.version,
        registryUrls: gradleModule.repos,
    };
}
async function extractDependenciesFromUpdatesReport(localDir) {
    const gradleProjectConfigurations = await readGradleReport(localDir);
    const dependencies = gradleProjectConfigurations
        .map(mergeDependenciesWithRepositories, [])
        .reduce(flatternDependencies, [])
        .reduce(combineReposOnDuplicatedDependencies, []);
    return dependencies
        .map((gradleModule) => buildDependency(gradleModule))
        .map((dep) => {
        /* https://github.com/renovatebot/renovate/issues/4627 */
        const { depName, currentValue } = dep;
        if (depName.endsWith('_%%')) {
            return {
                ...dep,
                depName: depName.replace(/_%%/, ''),
                datasource: datasourceSbtPackage.id,
            };
        }
        if (/^%.*%$/.test(currentValue)) {
            return { ...dep, skipReason: 'version-placeholder' };
        }
        return dep;
    });
}
exports.extractDependenciesFromUpdatesReport = extractDependenciesFromUpdatesReport;
//# sourceMappingURL=gradle-updates-report.js.map