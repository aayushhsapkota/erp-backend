import mongoose from "mongoose";

const companySchema = mongoose.Schema(
  {
    companyName: { type: String, default: "" },
    billingAddress: { type: String, default: "" },
    companyEmail: { type: String, default: "" },
    companyPhone: { type: String, default: "" },
    companyMobile: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

const Company = mongoose.model("Company", companySchema);

export default Company;
