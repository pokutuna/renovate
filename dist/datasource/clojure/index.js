"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registryStrategy = exports.defaultRegistryUrls = exports.id = void 0;
const common_1 = require("../maven/common");
exports.id = 'clojure';
exports.defaultRegistryUrls = ['https://clojars.org/repo', common_1.MAVEN_REPO];
exports.registryStrategy = 'merge';
var maven_1 = require("../maven");
Object.defineProperty(exports, "getReleases", { enumerable: true, get: function () { return maven_1.getReleases; } });
//# sourceMappingURL=index.js.map