"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flattenPackageRules = void 0;
const config_1 = require("../../../config");
const logger_1 = require("../../../logger");
function flattenPackageRules(packageRules) {
    var _a;
    const res = [];
    if (!(packageRules === null || packageRules === void 0 ? void 0 : packageRules.length)) {
        return res;
    }
    for (const rule of packageRules) {
        if ((_a = rule.packageRules) === null || _a === void 0 ? void 0 : _a.length) {
            logger_1.logger.debug('Flattening nested packageRules');
            for (const subrule of rule.packageRules) {
                const combinedRule = config_1.mergeChildConfig(rule, subrule);
                delete combinedRule.packageRules;
                res.push(combinedRule);
            }
        }
        else {
            res.push(rule);
        }
    }
    return res;
}
exports.flattenPackageRules = flattenPackageRules;
//# sourceMappingURL=flatten.js.map