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
exports.setEndpoint = exports.policyApi = exports.coreApi = exports.gitApi = exports.azureObj = void 0;
const azure = __importStar(require("azure-devops-node-api"));
const azure_devops_node_api_1 = require("azure-devops-node-api");
const platforms_1 = require("../../constants/platforms");
const hostRules = __importStar(require("../../util/host-rules"));
const hostType = platforms_1.PLATFORM_TYPE_AZURE;
let endpoint;
function getAuthenticationHandler(config) {
    if (!config.token && config.username && config.password) {
        return azure_devops_node_api_1.getBasicHandler(config.username, config.password);
    }
    return azure_devops_node_api_1.getHandlerFromToken(config.token);
}
function azureObj() {
    const config = hostRules.find({ hostType, url: endpoint });
    if (!config.token && !(config.username && config.password)) {
        throw new Error(`No config found for azure`);
    }
    const authHandler = getAuthenticationHandler(config);
    return new azure.WebApi(endpoint, authHandler);
}
exports.azureObj = azureObj;
function gitApi() {
    return azureObj().getGitApi();
}
exports.gitApi = gitApi;
function coreApi() {
    return azureObj().getCoreApi();
}
exports.coreApi = coreApi;
function policyApi() {
    return azureObj().getPolicyApi();
}
exports.policyApi = policyApi;
function setEndpoint(e) {
    endpoint = e;
}
exports.setEndpoint = setEndpoint;
//# sourceMappingURL=azure-got-wrapper.js.map