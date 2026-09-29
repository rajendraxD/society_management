"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const validate_js_1 = require("../middleware/validate.js");
const auth_js_1 = require("../middleware/auth.js");
const society_validations_js_1 = require("../validations/society.validations.js");
const router = (0, express_1.Router)();
/**
 * Credential-stuffing guard, scoped to this router only so it never throttles
 * the dashboard endpoints. Successful logins are not counted.
 */
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
        success: false,
        message: "Too many sign-in attempts. Please try again in 15 minutes.",
        errors: [],
    },
});
router.post("/login", loginLimiter, (0, validate_js_1.validate)(society_validations_js_1.loginSchema), auth_controller_js_1.AuthController.login);
router.post("/refresh", auth_controller_js_1.AuthController.refresh);
router.post("/logout", auth_js_1.requireAuth, auth_controller_js_1.AuthController.logout);
router.get("/me", auth_js_1.requireAuth, auth_controller_js_1.AuthController.me);
router.get("/roles", auth_controller_js_1.AuthController.getRoles);
exports.default = router;
