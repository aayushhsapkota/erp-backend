import mongoose from "mongoose";

const InvoiceSchema = mongoose.Schema(
  {
    invoiceNo: { type: Number },
    invoiceType: { type: String },
    statusIndex: { type: String },
    statusName: { type: String },
    totalAmount: { type: Number },
    paidAmount: { type: Number },
    dueDate: { type: Date },
    createdDate: { type: String },
    currencyUnit: { type: String },
    clientDetail: { type: Object },
    products: { type: Array },
    taxes: { type: Array },
    companyDetail: { type: Object },
    note: { type: String },
  },
  {
    timestamps: true,
  }
);

const Invoice = mongoose.model("Invoice", InvoiceSchema);

export default Invoice;
