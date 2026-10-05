import mongoose, { Schema } from "mongoose";
const SocietySchema = new Schema({
    name: { type: String, required: true },
    registrationNumber: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    totalFlats: { type: Number, default: 120 },
    wings: [{ type: String }],
    sinkingFund: { type: Number, default: 4820000 },
    repairFund: { type: Number, default: 1650000 },
    generalFund: { type: Number, default: 3200000 },
}, { timestamps: true });
export const Society = mongoose.model("Society", SocietySchema);
