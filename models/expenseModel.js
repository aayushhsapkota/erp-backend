import mongoose from "mongoose";

const ExpenseSchema = mongoose.Schema(
  {
  
    title: { type: String },
   
    category: { type: String },
    image: { type: String },
   
    price: {
      type: Number,
      default: 0,
    },
   
    
    remarks: { type: String },
    createdDate: {type:String}
  },
  {
    timestamps: true,
  }
);

const Expense = mongoose.model("Expense", ExpenseSchema);

export default Expense;
