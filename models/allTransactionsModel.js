import mongoose from "mongoose";

const TransactionSchema = mongoose.Schema(
  {
    transactionNumber: { type: String },
    transactionType: { type: String },
    partyDetails: { type: Object },
    productDetails: { type: Array },
    status: { type: String },
    amount: { type: Number },
    receviedAmount: { type: Number },
    totalAmountToPay: { type: Number },
    note: { type: String },
    billNumber: { type: String },
    createdDate: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model("Transaction", TransactionSchema);

export default Transaction;
