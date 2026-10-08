import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import cors from "cors";
// Parses incoming cookies and makes them available through req.cookies.
import cookieParser from "cookie-parser";
import ProductRoute from "./routes/productRoute.js";
import ClientRoute from "./routes/clientRoute.js";
import InvoiceRoute from "./routes/invoiceRoute.js";
import PaymentRoute from "./routes/paymentRoute.js";
import Transactions from "./routes/transactionsRoute.js";
import ExpenseRoute from "./routes/expenseRoute.js";
import DashDataRoute from "./routes/dashDataRoute.js";
import UserRoute from "./routes/userRoute.js";
import CompanyRoute from "./routes/companyRoute.js";


const app = express();

// Trusts the first proxy/load balancer so Express can correctly detect the client's IP and original HTTPS connection.
// Needed behind Render's reverse proxy so Express sees the original
// request as HTTPS - otherwise the refresh cookie's `secure` flag makes it
// look like it's being set over plain http and browsers drop it.
app.set("trust proxy", 1);


const allowedOrigins = (process.env.FRONTEND_URL || "")
//Split returns an array of strings. This allows multiple origins to be specified in the FRONTEND_URL environment variable, separated by commas.
  .split(",")
  //Removes unnecessary spaces from the array of origins
  .map((origin) => origin.trim())
  .concat(["http://localhost:5173", "http://localhost:3000"]);

//app.use syntax
// app.use(cors({
//     origin: allowedOrigins,
//     credentials: true
// }));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow browser responses to be read by approved origins or 
      // Requests without an Origin header (e.g., server-to-server or Postman)
      // are not subject to browser CORS restrictions.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    // Allows the browser to send the httpOnly refresh-token cookie with cross-origin requests.
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "30mb" }));
app.use(morgan("dev"));

app.use("/API/products", ProductRoute);
app.use("/API/clients", ClientRoute);
app.use("/API/invoices", InvoiceRoute);
app.use("/API/payments", PaymentRoute);
app.use("/API/transactions", Transactions);
app.use("/API/expenses", ExpenseRoute);
app.use("/API/dashData", DashDataRoute);
app.use("/API/users", UserRoute);
app.use("/API/company", CompanyRoute);


// Route();
const PORT = process.env.PORT || 80;

mongoose
  .connect(process.env.CONNECTION_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database connected");
    app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
  })
  .catch((error) => {
    console.log(`Database ${error.message} did not connect`);
    process.exit(1);
  });

export default app;
