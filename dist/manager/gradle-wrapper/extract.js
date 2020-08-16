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
const datasourceGradleVersion = __importStar(require("../../datasource/gradle-version"));
const logger_1 = require("../../logger");
const gradleVersioning = __importStar(require("../../versioning/gradle"));
const DISTRIBUTION_URL_REGEX = /^(?<assignment>distributionUrl\s*=\s*)\S*-(?<version>(\d|\.)+)-(?<type>bin|all)\.zip\s*$/;
function extractPackageFile(fileContent) {
    logger_1.logger.debug('gradle-wrapper.extractPackageFile()');
    const lines = fileContent.split('\n');
    for (const line of lines) {
        const distributionUrlMatch = DISTRIBUTION_URL_REGEX.exec(line);
        if (distributionUrlMatch) {
            const dependency = {
                depName: 'gradle',
                currentValue: distributionUrlMatch.groups.version,
                datasource: datasourceGradleVersion.id,
                versioning: gradleVersioning.id,
            };
            logger_1.logger.debug(dependency, 'Gradle Wrapper');
            return { deps: [dependency] };
        }
    }
    return null;
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map