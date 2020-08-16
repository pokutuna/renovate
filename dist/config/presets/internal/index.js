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
exports.getPreset = exports.groups = void 0;
const configPreset = __importStar(require("./config"));
const defaultPreset = __importStar(require("./default"));
const dockerPreset = __importStar(require("./docker"));
const groupPreset = __importStar(require("./group"));
const helpersPreset = __importStar(require("./helpers"));
const monorepoPreset = __importStar(require("./monorepo"));
const packagesPreset = __importStar(require("./packages"));
const previewPreset = __importStar(require("./preview"));
const schedulePreset = __importStar(require("./schedule"));
exports.groups = {
    config: configPreset.presets,
    default: defaultPreset.presets,
    docker: dockerPreset.presets,
    group: groupPreset.presets,
    helpers: helpersPreset.presets,
    monorepo: monorepoPreset.presets,
    packages: packagesPreset.presets,
    preview: previewPreset.presets,
    schedule: schedulePreset.presets,
};
function getPreset({ packageName: pkgName, presetName, }) {
    return exports.groups[pkgName]
        ? exports.groups[pkgName][presetName]
        : /* istanbul ignore next */ undefined;
}
exports.getPreset = getPreset;
//# sourceMappingURL=index.js.map