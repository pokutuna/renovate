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
const cargo = __importStar(require("./cargo"));
const composer = __importStar(require("./composer"));
const docker = __importStar(require("./docker"));
const git = __importStar(require("./git"));
const gradle = __importStar(require("./gradle"));
const hashicorp = __importStar(require("./hashicorp"));
const hex = __importStar(require("./hex"));
const ivy = __importStar(require("./ivy"));
const loose = __importStar(require("./loose"));
const maven = __importStar(require("./maven"));
const node = __importStar(require("./node"));
const npm = __importStar(require("./npm"));
const nuget = __importStar(require("./nuget"));
const pep440 = __importStar(require("./pep440"));
const poetry = __importStar(require("./poetry"));
const regex = __importStar(require("./regex"));
const ruby = __importStar(require("./ruby"));
const semver = __importStar(require("./semver"));
const swift = __importStar(require("./swift"));
const api = new Map();
exports.default = api;
api.set('cargo', cargo.api);
api.set('composer', composer.api);
api.set('docker', docker.api);
api.set('git', git.api);
api.set('gradle', gradle.api);
api.set('hashicorp', hashicorp.api);
api.set('hex', hex.api);
api.set('ivy', ivy.api);
api.set('loose', loose.api);
api.set('maven', maven.api);
api.set('node', node.api);
api.set('npm', npm.api);
api.set('nuget', nuget.api);
api.set('pep440', pep440.api);
api.set('poetry', poetry.api);
api.set('regex', regex.api);
api.set('ruby', ruby.api);
api.set('semver', semver.api);
api.set('swift', swift.api);
//# sourceMappingURL=api.generated.js.map