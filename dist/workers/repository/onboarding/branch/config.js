"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnboardingConfig = void 0;
const logger_1 = require("../../../../logger");
const clone_1 = require("../../../../util/clone");
function getOnboardingConfig(config) {
    const onboardingConfig = clone_1.clone(config.onboardingConfig);
    logger_1.logger.debug({ config: onboardingConfig }, 'onboarding config');
    return JSON.stringify(onboardingConfig, null, 2) + '\n';
}
exports.getOnboardingConfig = getOnboardingConfig;
//# sourceMappingURL=config.js.map