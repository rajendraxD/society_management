import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
let isConnected = false;
export async function connectDB() {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/society_management";
    try {
        mongoose.set("strictQuery", false);
        await mongoose.connect(uri, {
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
export function isDbConnected() {
    return isConnected;
}
