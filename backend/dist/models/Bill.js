"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bill = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const BillSchema = new mongoose_1.Schema({
    flatNumber: { type: String, required: true },
    wing: { type: String, required: true },
    residentName: { type: String, required: true },
    billingMonth: { type: String, required: true },
    amount: { type: Number, required: true },
    maintenanceCharges: { type: Number, required: true },
    sinkingFundCharges: { type: Number, default: 500 },
    waterCharges: { type: Number, default: 450 },
    parkingCharges: { type: Number, default: 600 },
    clubCharges: { type: Number, default: 300 },
    dueDate: { type: Date, required: true },
    status: {
        type: String,
        enum: ["paid", "pending", "overdue"],
        default: "pending",
    },
    paidDate: { type: Date },
    paymentMode: { type: String },
    transactionRef: { type: String },
}, { timestamps: true });
exports.Bill = mongoose_1.default.model("Bill", BillSchema);
