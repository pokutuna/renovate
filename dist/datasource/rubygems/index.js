"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registryStrategy = exports.defaultRegistryUrls = void 0;
var releases_1 = require("./releases");
Object.defineProperty(exports, "getReleases", { enumerable: true, get: function () { return releases_1.getReleases; } });
var common_1 = require("./common");
Object.defineProperty(exports, "id", { enumerable: true, get: function () { return common_1.id; } });
exports.defaultRegistryUrls = ['https://rubygems.org'];
exports.registryStrategy = 'hunt';
//# sourceMappingURL=index.js.map