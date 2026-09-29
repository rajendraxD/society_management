"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.isDbConnected = isDbConnected;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let isConnected = false;
async function connectDB() {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/society_management";
    try {
        mongoose_1.default.set("strictQuery", false);
        await mongoose_1.default.connect(uri, {
            serverSelectionTimeoutMS: 2000,
        });
        isConnected = true;
        console.log(`[MongoDB] Connected to database: ${uri}`);
        return true;
    }
    catch (error) {
        console.warn("[MongoDB] Direct connection failed or MongoDB daemon not running locally.");
        console.info("[MongoDB] Using resilient in-memory data store for Society Management backend.");
        isConnected = false;
        return false;
    }
}
function isDbConnected() {
    return isConnected;
}
