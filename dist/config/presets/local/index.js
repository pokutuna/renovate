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
exports.getPreset = void 0;
const platforms_1 = require("../../../constants/platforms");
const github = __importStar(require("../github"));
const gitlab = __importStar(require("../gitlab"));
function getPreset({ packageName: pkgName, presetName = 'default', baseConfig, }) {
    const { platform, endpoint } = baseConfig;
    if (!platform) {
        throw new Error(`Missing platform config for local preset.`);
    }
    switch (platform.toLowerCase()) {
        case platforms_1.PLATFORM_TYPE_GITLAB:
            return gitlab.getPresetFromEndpoint(pkgName, presetName, endpoint);
        case platforms_1.PLATFORM_TYPE_GITHUB:
            return github.getPresetFromEndpoint(pkgName, presetName, endpoint);
        default:
            throw new Error(`Unsupported platform '${baseConfig.platform}' for local preset.`);
    }
}
exports.getPreset = getPreset;
//# sourceMappingURL=index.js.map