"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NagadException = void 0;
class NagadException extends Error {
    constructor(message) {
        var _a;
        super(message);
        this.name = 'NagadException';
        this.stack = (_a = this.stack) !== null && _a !== void 0 ? _a : new Error().stack;
    }
}
exports.NagadException = NagadException;
