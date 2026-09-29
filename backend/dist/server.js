"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_js_1 = require("./config/db.js");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const auth_routes_js_1 = __importDefault(require("./routes/auth.routes.js"));
const admin_routes_js_1 = __importDefault(require("./routes/admin.routes.js"));
const resident_routes_js_1 = __importDefault(require("./routes/resident.routes.js"));
const security_routes_js_1 = __importDefault(require("./routes/security.routes.js"));
const committee_routes_js_1 = __importDefault(require("./routes/committee.routes.js"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === "production";
/**
 * Browser origins allowed to call the API. The Ionic dev server and the
 * Capacitor WebView both need to be listed explicitly.
 *
 * This fails closed on purpose: the previous `?? true` fallback reflected any
 * origin back, which combined with credentialed requests is an open door.
 */
const allowedOrigins = (process.env.CLIENT_URL ||
    "http://localhost:8100,http://localhost:5173,capacitor://localhost,https://localhost,http://localhost")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express_1.default.json({ limit: "1mb" }));
app.use((0, cookie_parser_1.default)());
app.use((0, morgan_1.default)(isProd ? "combined" : "dev"));
// Health Check
app.get("/api/health", (_req, res) => {
    res.json({
        success: true,
        message: "Society Management API is running",
        data: {
            society: "Harmony Heights Co-op Housing Society",
            version: "1.0.0",
            database: (0, db_js_1.isDbConnected)() ? "connected" : "in-memory",
            timestamp: new Date().toISOString(),
        },
    });
});
// API Routes
app.use("/api/auth", auth_routes_js_1.default);
app.use("/api/admin", admin_routes_js_1.default);
app.use("/api/resident", resident_routes_js_1.default);
app.use("/api/security", security_routes_js_1.default);
app.use("/api/committee", committee_routes_js_1.default);
// Unmatched routes and centralized error formatting (must stay last)
app.use(errorHandler_js_1.notFoundHandler);
app.use(errorHandler_js_1.errorHandler);
async function startServer() {
    const connected = await (0, db_js_1.connectDB)();
    if (!connected && isProd) {
        // Serving a production API from the in-memory demo store would silently
        // discard every write. Refuse to start instead.
        console.error("[Server] MongoDB is required in production but was unreachable. Exiting.");
        process.exit(1);
    }
    if (!connected) {
        console.warn("[Server] Running on the in-memory demo dataset. Data will NOT persist across restarts.");
    }
    app.listen(PORT, () => {
        console.log(`[Society Management Backend] Server running at http://localhost:${PORT}`);
    });
}
startServer();
