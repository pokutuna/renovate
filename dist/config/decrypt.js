"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptConfig = void 0;
const crypto_1 = __importDefault(require("crypto"));
const is_1 = __importDefault(require("@sindresorhus/is"));
const logger_1 = require("../logger");
const mask_1 = require("../util/mask");
const sanitize_1 = require("../util/sanitize");
function decryptConfig(config, privateKey) {
    logger_1.logger.trace({ config }, 'decryptConfig()');
    const decryptedConfig = { ...config };
    for (const [key, val] of Object.entries(config)) {
        if (key === 'encrypted' && is_1.default.object(val)) {
            logger_1.logger.debug({ config: val }, 'Found encrypted config');
            if (privateKey) {
                for (const [eKey, eVal] of Object.entries(val)) {
                    try {
                        let decryptedStr;
                        try {
                            logger_1.logger.debug('Trying default padding for ' + eKey);
                            decryptedStr = crypto_1.default
                                .privateDecrypt(privateKey, Buffer.from(eVal, 'base64'))
                                .toString();
                            logger_1.logger.debug('Decrypted config using default padding');
                        }
                        catch (err) {
                            logger_1.logger.debug('Trying RSA_PKCS1_PADDING for ' + eKey);
                            decryptedStr = crypto_1.default
                                .privateDecrypt({
                                key: privateKey,
                                padding: crypto_1.default.constants.RSA_PKCS1_PADDING,
                            }, Buffer.from(eVal, 'base64'))
                                .toString();
                            // let it throw if the above fails
                        }
                        // istanbul ignore if
                        if (!decryptedStr.length) {
                            throw new Error('empty string');
                        }
                        logger_1.logger.debug(`Decrypted ${eKey}`);
                        if (eKey === 'npmToken') {
                            const token = decryptedStr.replace(/\n$/, '');
                            sanitize_1.add(token);
                            logger_1.logger.debug({ decryptedToken: mask_1.maskToken(token) }, 'Migrating npmToken to npmrc');
                            if (decryptedConfig.npmrc) {
                                /* eslint-disable no-template-curly-in-string */
                                if (decryptedConfig.npmrc.includes('${NPM_TOKEN}')) {
                                    logger_1.logger.debug('Replacing ${NPM_TOKEN} with decrypted token');
                                    decryptedConfig.npmrc = decryptedConfig.npmrc.replace(/\${NPM_TOKEN}/g, token);
                                }
                                else {
                                    logger_1.logger.debug('Appending _authToken= to end of existing npmrc');
                                    decryptedConfig.npmrc = decryptedConfig.npmrc.replace(/\n?$/, `\n_authToken=${token}\n`);
                                }
                                /* eslint-enable no-template-curly-in-string */
                            }
                            else {
                                logger_1.logger.debug('Adding npmrc to config');
                                decryptedConfig.npmrc = `//registry.npmjs.org/:_authToken=${token}\n`;
                            }
                        }
                        else {
                            decryptedConfig[eKey] = decryptedStr;
                            sanitize_1.add(decryptedStr);
                        }
                    }
                    catch (err) {
                        const error = new Error('config-validation');
                        error.validationError = `Failed to decrypt field ${eKey}. Please re-encrypt and try again.`;
                        throw error;
                    }
                }
            }
            else {
                logger_1.logger.error('Found encrypted data but no privateKey');
            }
            delete decryptedConfig.encrypted;
        }
        else if (is_1.default.array(val)) {
            decryptedConfig[key] = [];
            val.forEach((item) => {
                if (is_1.default.object(item) && !is_1.default.array(item)) {
                    decryptedConfig[key].push(decryptConfig(item, privateKey));
                }
                else {
                    decryptedConfig[key].push(item);
                }
            });
        }
        else if (is_1.default.object(val) && key !== 'content') {
            decryptedConfig[key] = decryptConfig(val, privateKey);
        }
    }
    delete decryptedConfig.encrypted;
    logger_1.logger.trace({ config: decryptedConfig }, 'decryptedConfig');
    return decryptedConfig;
}
exports.decryptConfig = decryptConfig;
//# sourceMappingURL=decrypt.js.map