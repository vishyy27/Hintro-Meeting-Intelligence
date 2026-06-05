"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return next({
                    status: 400,
                    code: 'VALIDATION_ERROR',
                    message: error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
                });
            }
            next(error);
        }
    };
};
exports.validate = validate;
