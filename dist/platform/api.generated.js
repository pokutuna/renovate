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
const azure = __importStar(require("./azure"));
const bitbucket = __importStar(require("./bitbucket"));
const bitbucketServer = __importStar(require("./bitbucket-server"));
const gitea = __importStar(require("./gitea"));
const github = __importStar(require("./github"));
const gitlab = __importStar(require("./gitlab"));
const api = new Map();
exports.default = api;
api.set('azure', azure);
api.set('bitbucket', bitbucket);
api.set('bitbucket-server', bitbucketServer);
api.set('gitea', gitea);
api.set('github', github);
api.set('gitlab', gitlab);
//# sourceMappingURL=api.generated.js.map