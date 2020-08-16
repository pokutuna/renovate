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
exports.initApis = void 0;
const npmApi = __importStar(require("../../../datasource/npm"));
const platform_1 = require("../../../platform");
// TODO: fix types
async function getPlatformConfig(config) {
    const platformConfig = await platform_1.platform.initRepo(config);
    return {
        ...config,
        ...platformConfig,
    };
}
// TODO: fix types
async function initApis(input) {
    let config = { ...input };
    config = await getPlatformConfig(config);
    npmApi.resetMemCache();
    npmApi.setNpmrc(config.npmrc);
    return config;
}
exports.initApis = initApis;
//# sourceMappingURL=apis.js.map