"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRangeStrategy = exports.extractPackageFile = exports.getPackageUpdates = exports.extractAllPackageFiles = exports.getManagers = exports.getManagerList = exports.getLanguageList = exports.get = void 0;
const languages_1 = require("../constants/languages");
const api_generated_1 = __importDefault(require("./api.generated"));
const managerList = Array.from(api_generated_1.default.keys());
const languageList = [
    languages_1.LANGUAGE_DART,
    languages_1.LANGUAGE_DOCKER,
    languages_1.LANGUAGE_DOT_NET,
    languages_1.LANGUAGE_ELIXIR,
    languages_1.LANGUAGE_GOLANG,
    languages_1.LANGUAGE_JAVASCRIPT,
    languages_1.LANGUAGE_NODE,
    languages_1.LANGUAGE_PHP,
    languages_1.LANGUAGE_PYTHON,
    languages_1.LANGUAGE_RUBY,
    languages_1.LANGUAGE_RUST,
];
function get(manager, name) {
    var _a;
    return (_a = api_generated_1.default.get(manager)) === null || _a === void 0 ? void 0 : _a[name];
}
exports.get = get;
exports.getLanguageList = () => languageList;
exports.getManagerList = () => managerList;
exports.getManagers = () => api_generated_1.default;
async function extractAllPackageFiles(manager, config, files) {
    if (!api_generated_1.default.has(manager)) {
        return null;
    }
    const m = api_generated_1.default.get(manager);
    if (m.extractAllPackageFiles) {
        const res = await m.extractAllPackageFiles(config, files);
        // istanbul ignore if
        if (!res) {
            return null;
        }
        return res;
    }
    return null;
}
exports.extractAllPackageFiles = extractAllPackageFiles;
function getPackageUpdates(manager, config) {
    if (!api_generated_1.default.has(manager)) {
        return null;
    }
    const m = api_generated_1.default.get(manager);
    return m.getPackageUpdates ? m.getPackageUpdates(config) : null;
}
exports.getPackageUpdates = getPackageUpdates;
function extractPackageFile(manager, content, fileName, config) {
    if (!api_generated_1.default.has(manager)) {
        return null;
    }
    const m = api_generated_1.default.get(manager);
    return m.extractPackageFile
        ? m.extractPackageFile(content, fileName, config)
        : null;
}
exports.extractPackageFile = extractPackageFile;
function getRangeStrategy(config) {
    const { manager, rangeStrategy } = config;
    if (!api_generated_1.default.has(manager)) {
        return null;
    }
    const m = api_generated_1.default.get(manager);
    if (m.getRangeStrategy) {
        // Use manager's own function if it exists
        return m.getRangeStrategy(config);
    }
    if (rangeStrategy === 'auto') {
        // default to 'replace' for auto
        return 'replace';
    }
    return config.rangeStrategy;
}
exports.getRangeStrategy = getRangeStrategy;
//# sourceMappingURL=index.js.map