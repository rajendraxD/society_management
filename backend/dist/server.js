import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { fileURLToPath, pathToFileURL } from "node:url";
import { connectDB, isDbConnected } from "./config/db.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import residentRoutes from "./routes/resident.routes.js";
import securityRoutes from "./routes/security.routes.js";
import committeeRoutes from "./routes/committee.routes.js";
dotenv.config();
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
/**
 * Builds the Express app without binding a port.
 *
 * Exported so the test suite can mount it in-process and hit it over an
 * ephemeral port — importing this module for its side effect alone would
 * start a listener that never closes and hang `node --test`.
 */
export function createApp() {
    const app = express();
    // Middleware
    app.use(helmet());
    app.use(cors({
        origin: allowedOrigins,
        credentials: true,
    }));
    app.use(express.json({ limit: "1mb" }));
    app.use(cookieParser());
    app.use(morgan(isProd ? "combined" : "dev"));
    // Health Check
    app.get("/api/health", (_req, res) => {
        res.json({
            success: true,
            message: "Society Management API is running",
            data: {
                society: "Harmony Heights Co-op Housing Society",
                version: "1.0.0",
                database: isDbConnected() ? "connected" : "in-memory",
                timestamp: new Date().toISOString(),
            },
        });
    });
    // API Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/resident", residentRoutes);
    app.use("/api/security", securityRoutes);
    app.use("/api/committee", committeeRoutes);
    // Unmatched routes and centralized error formatting (must stay last)
    app.use(notFoundHandler);
    app.use(errorHandler);
    return app;
}
async function startServer() {
    const connected = await connectDB();
    if (!connected && isProd) {
        // Serving a production API from the in-memory demo store would silently
        // discard every write. Refuse to start instead.
        console.error("[Server] MongoDB is required in production but was unreachable. Exiting.");
        process.exit(1);
    }
    if (!connected) {
        console.warn("[Server] Running on the in-memory demo dataset. Data will NOT persist across restarts.");
    }
    const app = createApp();
    app.listen(PORT, () => {
        console.log(`[Society Management Backend] Server running at http://localhost:${PORT}`);
    });
}
// Only when run directly (`npm run dev` / `npm start`). Under `node --test`
// this module is imported for `createApp` and the suite brings its own server.
const invokedDirectly = process.argv[1] &&
    pathToFileURL(process.argv[1]).href ===
        pathToFileURL(fileURLToPath(import.meta.url)).href;
if (invokedDirectly) {
    startServer();
}
