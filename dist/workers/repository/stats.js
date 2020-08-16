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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printRequestStats = void 0;
const url_1 = __importDefault(require("url"));
const logger_1 = require("../../logger");
const memCache = __importStar(require("../../util/cache/memory"));
function printRequestStats() {
    const httpRequests = memCache.get('http-requests');
    if (!httpRequests) {
        return;
    }
    httpRequests.sort((a, b) => {
        if (a.url === b.url) {
            return 0;
        }
        if (a.url < b.url) {
            return -1;
        }
        return 1;
    });
    const allRequests = [];
    const requestHosts = {};
    for (const request of httpRequests) {
        allRequests.push(`${request.method.toUpperCase()} ${request.url} ${request.duration}`);
        const { hostname } = url_1.default.parse(request.url);
        requestHosts[hostname] = requestHosts[hostname] || [];
        requestHosts[hostname].push(request.duration);
    }
    logger_1.logger.trace({ allRequests, requestHosts }, 'full stats');
    const hostStats = [];
    let totalRequests = 0;
    for (const [hostname, requests] of Object.entries(requestHosts)) {
        const hostRequests = requests.length;
        totalRequests += hostRequests;
        const requestSum = requests.reduce((a, b) => a + b, 0);
        const avg = Math.round(requestSum / hostRequests);
        const requestCount = `${hostRequests} ` + (hostRequests > 1 ? 'requests' : 'request');
        hostStats.push(`${hostname}, ${requestCount}, ${avg}ms average`);
    }
    logger_1.logger.debug({ hostStats, totalRequests }, 'http statistics');
}
exports.printRequestStats = printRequestStats;
//# sourceMappingURL=stats.js.map