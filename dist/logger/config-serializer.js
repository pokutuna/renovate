"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const traverse_1 = __importDefault(require("traverse"));
function configSerializer(config) {
    const templateFields = ['prBody'];
    const contentFields = [
        'content',
        'contents',
        'packageLockParsed',
        'yarnLockParsed',
    ];
    const arrayFields = ['packageFiles', 'upgrades'];
    return traverse_1.default(config).map(
    // eslint-disable-next-line array-callback-return
    function scrub(val) {
        if (val && templateFields.includes(this.key)) {
            this.update('[Template]');
        }
        if (val && contentFields.includes(this.key)) {
            this.update('[content]');
        }
        // istanbul ignore if
        if (val && arrayFields.includes(this.key)) {
            this.update('[Array]');
        }
    });
}
exports.default = configSerializer;
//# sourceMappingURL=config-serializer.js.map