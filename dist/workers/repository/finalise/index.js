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
exports.finaliseRepo = void 0;
const platform_1 = require("../../../platform");
const repositoryCache = __importStar(require("../../../util/cache/repository"));
const prune_1 = require("./prune");
// istanbul ignore next
async function finaliseRepo(config, branchList) {
    await repositoryCache.finalize();
    await prune_1.pruneStaleBranches(config, branchList);
    await platform_1.platform.ensureIssueClosing(`Action Required: Fix Renovate Configuration`);
}
exports.finaliseRepo = finaliseRepo;
//# sourceMappingURL=index.js.map