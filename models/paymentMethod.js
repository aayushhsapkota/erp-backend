import mongoose from "mongoose";

const PaymentMethodSchema = mongoose.Schema(
  {
    paymentType: { type: String },
    paymentDate: { type: String },
    paymentNumber: { type: String },
    partyDetails: { type: Object },
    amount: { type: Number },
    note: { type: String },
  },
  {
    timestamps: true,
  }
);

const PaymentMethod = mongoose.model("PaymentMethod", PaymentMethodSchema);

export default PaymentMethod;
