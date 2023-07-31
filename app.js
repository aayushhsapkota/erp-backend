import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
// import bodyParser from "body-parser";
import morgan from "morgan";
import cors from "cors";
import ProductRoute from "./routes/productRoute.js";
import ClientRoute from "./routes/clientRoute.js";
import InvoiceRoute from "./routes/invoiceRoute.js";
import PaymentRoute from "./routes/paymentRoute.js";
import Transactions from "./routes/transactionsRoute.js";
import ExpenseRoute from "./routes/expenseRoute.js";
import DashDataRoute from "./routes/dashDataRoute.js";
import UserRoute from "./routes/userRoute.js";


const app = express();
app.use(cors());

dotenv.config();
// app.use(bodyParser.json({ limit: "30mb", extended: true }));
// app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(morgan("dev"));

app.use("/API/products", ProductRoute);
app.use("/API/clients", ClientRoute);
app.use("/API/invoices", InvoiceRoute);
app.use("/API/payments", PaymentRoute);
app.use("/API/transactions", Transactions);
app.use("/API/expenses", ExpenseRoute);
app.use("/API/dashData", DashDataRoute);
app.use("/API/users", UserRoute);


// Route();
const PORT = process.env.PORT || 80;
mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.CONNECTION_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected"))
  .catch((error) => console.log(`Database ${error.message} did not connect`))
  .finally(() =>
    app.listen(PORT, console.log(`Server running on port: ${PORT}`))
  );

export default app;
