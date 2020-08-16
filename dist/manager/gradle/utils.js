"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareGradleCommand = exports.gradleWrapperFileName = exports.extraEnv = void 0;
const os_1 = __importDefault(require("os"));
const fs_extra_1 = require("fs-extra");
const upath_1 = __importDefault(require("upath"));
const common_1 = require("../../util/exec/common");
exports.extraEnv = {
    GRADLE_OPTS: '-Dorg.gradle.parallel=true -Dorg.gradle.configureondemand=true -Dorg.gradle.daemon=false -Dorg.gradle.caching=false',
};
function gradleWrapperFileName(config) {
    if (os_1.default.platform() === 'win32' &&
        (config === null || config === void 0 ? void 0 : config.binarySource) !== common_1.BinarySource.Docker) {
        return 'gradlew.bat';
    }
    return './gradlew';
}
exports.gradleWrapperFileName = gradleWrapperFileName;
async function prepareGradleCommand(gradlewName, cwd, gradlew, args) {
    /* eslint-disable no-bitwise */
    // istanbul ignore if
    if ((gradlew === null || gradlew === void 0 ? void 0 : gradlew.isFile()) === true) {
        // if the file is not executable by others
        if ((gradlew.mode & 0o1) === 0) {
            // add the execution permission to the owner, group and others
            await fs_extra_1.chmod(upath_1.default.join(cwd, gradlewName), gradlew.mode | 0o111);
        }
        if (args === null) {
            return gradlewName;
        }
        return `${gradlewName} ${args}`;
    }
    /* eslint-enable no-bitwise */
    return null;
}
exports.prepareGradleCommand = prepareGradleCommand;
//# sourceMappingURL=utils.js.map