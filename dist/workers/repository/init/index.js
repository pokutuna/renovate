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
exports.initRepo = void 0;
const logger_1 = require("../../../logger");
const platform_1 = require("../../../platform");
const memCache = __importStar(require("../../../util/cache/memory"));
const repositoryCache = __importStar(require("../../../util/cache/repository"));
const git_1 = require("../../../util/git");
const configured_1 = require("../configured");
const branch_1 = require("../onboarding/branch");
const apis_1 = require("./apis");
const base_1 = require("./base");
const config_1 = require("./config");
const semantic_1 = require("./semantic");
const vulnerability_1 = require("./vulnerability");
async function initRepo(input) {
    memCache.init();
    await repositoryCache.initialize(input);
    let config = {
        ...input,
        errors: [],
        warnings: [],
        branchList: [],
    };
    config = await apis_1.initApis(config);
    config.semanticCommits = await semantic_1.detectSemanticCommits(config);
    config.baseBranch = config.defaultBranch;
    config.baseBranchSha = await platform_1.platform.setBaseBranch(config.baseBranch);
    config = await branch_1.checkOnboardingBranch(config);
    config = await config_1.mergeRenovateConfig(config);
    configured_1.checkIfConfigured(config);
    config = await base_1.checkBaseBranch(config);
    await git_1.setBranchPrefix(config.branchPrefix);
    config = await vulnerability_1.detectVulnerabilityAlerts(config);
    // istanbul ignore if
    if (config.printConfig) {
        logger_1.logger.debug({ config }, 'Full resolved config including presets');
    }
    return config;
}
exports.initRepo = initRepo;
//# sourceMappingURL=index.js.map