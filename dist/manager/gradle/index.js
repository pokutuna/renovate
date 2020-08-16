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
exports.defaultConfig = exports.language = exports.updateDependency = exports.extractAllPackageFiles = exports.executeGradle = exports.GRADLE_DEPENDENCY_REPORT_OPTIONS = void 0;
const fs_extra_1 = require("fs-extra");
const upath_1 = __importDefault(require("upath"));
const languages_1 = require("../../constants/languages");
const datasourceMaven = __importStar(require("../../datasource/maven"));
const logger_1 = require("../../logger");
const external_host_error_1 = require("../../types/errors/external-host-error");
const exec_1 = require("../../util/exec");
const fs_1 = require("../../util/fs");
const gradleVersioning = __importStar(require("../../versioning/gradle"));
const build_gradle_1 = require("./build-gradle");
const gradle_updates_report_1 = require("./gradle-updates-report");
const utils_1 = require("./utils");
exports.GRADLE_DEPENDENCY_REPORT_OPTIONS = '--init-script renovate-plugin.gradle renovate';
const TIMEOUT_CODE = 143;
async function prepareGradleCommandFallback(gradlewName, cwd, gradlew, args) {
    const cmd = await utils_1.prepareGradleCommand(gradlewName, cwd, gradlew, args);
    if (cmd === null) {
        return `gradle ${args}`;
    }
    return cmd;
}
async function executeGradle(config, cwd, gradlew) {
    var _a;
    let stdout;
    let stderr;
    let timeout;
    if ((_a = config.gradle) === null || _a === void 0 ? void 0 : _a.timeout) {
        timeout = config.gradle.timeout * 1000;
    }
    const cmd = await prepareGradleCommandFallback(utils_1.gradleWrapperFileName(config), cwd, gradlew, exports.GRADLE_DEPENDENCY_REPORT_OPTIONS);
    const execOptions = {
        timeout,
        cwd,
        docker: {
            image: 'renovate/gradle',
        },
        extraEnv: utils_1.extraEnv,
    };
    try {
        logger_1.logger.debug({ cmd }, 'Start gradle command');
        ({ stdout, stderr } = await exec_1.exec(cmd, execOptions));
    }
    catch (err) /* istanbul ignore next */ {
        if (err.code === TIMEOUT_CODE) {
            throw new external_host_error_1.ExternalHostError(err, 'gradle');
        }
        logger_1.logger.warn({ errMessage: err.message }, 'Gradle extraction failed');
        return;
    }
    logger_1.logger.debug(stdout + stderr);
    logger_1.logger.debug('Gradle report complete');
}
exports.executeGradle = executeGradle;
async function extractAllPackageFiles(config, packageFiles) {
    let rootBuildGradle;
    let gradlew;
    for (const packageFile of packageFiles) {
        const dirname = upath_1.default.dirname(packageFile);
        const gradlewPath = upath_1.default.join(dirname, utils_1.gradleWrapperFileName(config));
        gradlew = await fs_extra_1.stat(upath_1.default.join(config.localDir, gradlewPath)).catch(() => null);
        if (['build.gradle', 'build.gradle.kts'].includes(packageFile)) {
            rootBuildGradle = packageFile;
            break;
        }
        // If there is gradlew in the same directory, the directory should be a Gradle project root
        if ((gradlew === null || gradlew === void 0 ? void 0 : gradlew.isFile()) === true) {
            rootBuildGradle = packageFile;
            break;
        }
    }
    if (!rootBuildGradle) {
        logger_1.logger.warn('No root build.gradle nor build.gradle.kts found - skipping');
        return null;
    }
    logger_1.logger.debug('Extracting dependencies from all gradle files');
    const cwd = upath_1.default.join(config.localDir, upath_1.default.dirname(rootBuildGradle));
    await gradle_updates_report_1.createRenovateGradlePlugin(cwd);
    await executeGradle(config, cwd, gradlew);
    build_gradle_1.init();
    const dependencies = await gradle_updates_report_1.extractDependenciesFromUpdatesReport(cwd);
    if (dependencies.length === 0) {
        return [];
    }
    const gradleFiles = [];
    for (const packageFile of packageFiles) {
        const content = await fs_1.readLocalFile(packageFile, 'utf8');
        if (content) {
            gradleFiles.push({
                packageFile,
                datasource: datasourceMaven.id,
                deps: dependencies,
            });
            build_gradle_1.collectVersionVariables(dependencies, content);
        }
        else {
            // istanbul ignore next
            logger_1.logger.debug({ packageFile }, 'packageFile has no content');
        }
    }
    return gradleFiles;
}
exports.extractAllPackageFiles = extractAllPackageFiles;
function buildGradleDependency(config) {
    return {
        group: config.depGroup,
        name: config.name,
        version: config.currentValue,
    };
}
function updateDependency({ fileContent, upgrade, }) {
    // prettier-ignore
    logger_1.logger.debug(`gradle.updateDependency(): packageFile:${upgrade.packageFile} depName:${upgrade.depName}, version:${upgrade.currentValue} ==> ${upgrade.newValue}`);
    return build_gradle_1.updateGradleVersion(fileContent, buildGradleDependency(upgrade), upgrade.newValue);
}
exports.updateDependency = updateDependency;
exports.language = languages_1.LANGUAGE_JAVA;
exports.defaultConfig = {
    fileMatch: ['\\.gradle(\\.kts)?$', '(^|/)gradle.properties$'],
    timeout: 600,
    versioning: gradleVersioning.id,
};
//# sourceMappingURL=index.js.map