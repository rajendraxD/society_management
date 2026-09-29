"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const errorHandler_js_1 = require("./errorHandler.js");
/**
 * Validates one part of the request against a zod schema and replaces it with
 * the parsed (typed, coerced) value. Never trust the client payload — every
 * mutating route runs through here before its controller.
 */
function validate(schema, part = "body") {
    return (req, _res, next) => {
        const result = schema.safeParse(req[part]);
        if (!result.success) {
            const errors = result.error.issues.map((issue) => ({
                field: issue.path.join(".") || part,
                message: issue.message,
            }));
            return next(new errorHandler_js_1.ApiError(400, "Validation failed", errors));
        }
        // `query` and `params` are read-only getters on some Express versions,
        // so only body is reassigned.
        if (part === "body") {
            req.body = result.data;
        }
        else {
            Object.assign(req[part], result.data);
        }
        next();
    };
}
