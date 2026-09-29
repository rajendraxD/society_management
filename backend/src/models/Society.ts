import mongoose, { Document, Schema } from "mongoose";

export interface ISociety extends Document {
  name: string;
  registrationNumber: string;
  address: string;
  city: string;
  pincode: string;
  totalFlats: number;
  wings: string[];
  sinkingFund: number;
  repairFund: number;
  generalFund: number;
}

const SocietySchema = new Schema<ISociety>(
  {
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
  },
  { timestamps: true }
);

export const Society = mongoose.model<ISociety>("Society", SocietySchema);
