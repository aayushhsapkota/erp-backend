import mongoose from "mongoose";
import NepaliDate from "nepali-date-converter";

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
    dateInfo: {
      year: { type: Number },
      month: { type: Number },
      day: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);


// Middleware to populate dateInfo
InvoiceSchema.pre('save', function(next) {
  const nepDate = new NepaliDate();
  this.dateInfo = {
    year: nepDate.getYear(),
    month: nepDate.getMonth()+1,
    day: nepDate.getDate(),
  };
  next();
});

const Invoice = mongoose.model("Invoice", InvoiceSchema);

export default Invoice;
