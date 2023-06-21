import invoiceModel from "../models/invoiceModel.js";
import expenseModel from "../models/expenseModel.js";
import productModel from "../models/productModel.js";
import clientModel from "../models/clientModel.js";
import transactionModel from "../models/allTransactionsModel.js";
// import NepaliDate from 'nepali-date-converter';

const TIME_RANGES = {
  THIS_WEEK: "thisWeek",
  LAST_WEEK: "lastWeek",
  THIS_MONTH: "thisMonth",
  LAST_MONTH: "lastMonth",
  THIS_YEAR: "thisYear",
  LAST_YEAR: "lastYear",
};

const groupByPeriod = {
  [TIME_RANGES.THIS_WEEK]: { $dayOfWeek: "$createdAt" },
  [TIME_RANGES.LAST_WEEK]: { $dayOfWeek: "$createdAt" },
  [TIME_RANGES.THIS_MONTH]: { 
    $add: [
      1,
      {
        $floor: {
          $divide: [
            { $subtract: [{ $dayOfMonth: "$createdAt" }, 1] },
            7
          ]
        }
      },
    ] 
  },
  [TIME_RANGES.LAST_MONTH]: { 
    $add: [
      1,
      {
        $floor: {
          $divide: [
            { $subtract: [{ $dayOfMonth: "$createdAt" }, 1] },
            7
          ]
        }
      },
    ]
  },

  [TIME_RANGES.THIS_YEAR]: {
    $add: [
      1,
      {
        $floor: {
          $divide: [
            { $subtract: [{ $month: "$createdAt" }, 1] },
            3
          ]
        }
      },
    ]
  },
  
  [TIME_RANGES.LAST_YEAR]: {
    $add: [
      1,
      {
        $floor: {
          $divide: [
            { $subtract: [{ $month: "$createdAt" }, 1] },
            3
          ]
        }
      },
    ]
  }
};

const getTimeRange = (timeRange, now = new Date()) => {
    // Define startDay and endDay here
    let startDay = new Date(now);
    let endDay = new Date(now);
  
    switch (timeRange) {
      case "thisWeek":
        startDay.setDate(now.getDate() - now.getDay());
        endDay.setDate(now.getDate() - now.getDay() + 6);
        break;
      case "lastWeek":
        startDay.setDate(now.getDate() - now.getDay() - 7);
        endDay.setDate(now.getDate() - now.getDay() - 1);
        break;
      case "thisMonth":
        startDay.setDate(1);
        endDay.setMonth(now.getMonth() + 1, 0);
        break;
      case "lastMonth":
        startDay.setMonth(now.getMonth() - 1, 1);
        endDay.setDate(0);
        break;
      case "thisYear":
        startDay.setMonth(0, 1);
        endDay.setMonth(11, 31);
        break;
      case "lastYear":
        startDay.setFullYear(now.getFullYear() - 1, 0, 1);
        endDay.setFullYear(now.getFullYear() - 1, 11, 31);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: `Invalid time range provided: ${timeRange}`,
        });
    }
    startDay.setHours(0, 0, 0, 0);
    endDay.setHours(23, 59, 59, 999);

    // startDay= new NepaliDate(new Date(startDay)).format('YYYY-MM-DD');
    // endDay= new NepaliDate(new Date(endDay)).format('YYYY-MM-DD');

    return { startDay, endDay };
    
  };
  

export const getRevenueData = async (req, res) => {
    console.log("reached");
    const { timeRange } = req.query;
  
    if(!timeRange || !Object.values(TIME_RANGES).includes(timeRange)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid or missing time range provided',
        });
    }
  
    const { startDay, endDay } = getTimeRange(timeRange);
  
    try {
        const data = await invoiceModel.aggregate([
            {
                $match:{
                    createdAt: { $gte: startDay, $lte: endDay },
                    invoiceType: 'Sale'
                }
            },
            {
                $group: {
                    _id: groupByPeriod[timeRange],
                    totalSales: { $sum: '$totalAmount' },
                    totalMoneyReceived: { $sum: '$paidAmount' }
                }
            },
            {
                $sort: { _id: 1 } // Sort by the period (day, week, quarter)
            }
        ]);
        //second aggregation pipeline
        const totalData = await invoiceModel.aggregate([
          {
              $match:{
                  createdAt: { $gte: startDay, $lte: endDay },
                  invoiceType: 'Sale'
              }
          },
          {
              $group: {
                  _id: null,
                  totalSales: { $sum: '$totalAmount' },
              }
          }
      ]);

      // Third Aggregation to calculate total returned amount for invoices of type "SalesReturn"
      const totalReturnedData = await invoiceModel.aggregate([
        {
            $match:{
                createdAt: { $gte: startDay, $lte: endDay },
                invoiceType: 'SalesReturn'
            }
        },
        {
            $group: {
                _id: null,
                totalReturned: { $sum: '$totalAmount' },
            }
        }
    ]);
  
        // No data found
        if (!data.length) {
            return res.status(404).json({
                success: false,
                message: `No data found for ${timeRange}`
            });
        }
  
        // Send the data
        return res.status(200).json({
            success: true,
            data,
            totalSales: totalData.length?totalData[0].totalSales:0,
            totalReturned: totalReturnedData.length ? totalReturnedData[0].totalReturned : 0
        });
  
    } catch (error) {
        // Catch any error
        console.error(error);
        return res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
        });
    }
  }

  export const getExpenseData = async (req, res) => {
    console.log("reached");
    const { timeRange } = req.query;

    if(!timeRange || !Object.values(TIME_RANGES).includes(timeRange)) {
      return res.status(400).json({
          success: false,
          message: 'Invalid or missing time range provided',
      });
  }

  const { startDay, endDay } = getTimeRange(timeRange);

  try {
    const data = await expenseModel.aggregate([
        {
            $match:{
                createdAt: { $gte: startDay, $lte: endDay },
            }
        },
        {
            $group: {
                _id:"$category",
                totalExpense: { $sum: '$amount' },
            }
        },
        {
            $sort: { _id: 1 } // Sort by the period (day, week, quarter)
        }
    ]);

    // No data found
    if (!data.length) {
        return res.status(404).json({
            success: false,
            message: `No data found for ${timeRange}`
        });
    }

    // Send the data
    return res.status(200).json({
        success: true,
        data
    });

} catch (error) {
    // Catch any error
    console.error(error);
    return res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
}
}

export const getRevenueByCategory = async (req, res) => {
    const { timeRange } = req.query;
  
    if (!timeRange || !Object.values(TIME_RANGES).includes(timeRange)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing time range provided',
      });
    }
  
    const { startDay, endDay } = getTimeRange(timeRange);
    console.log(startDay);
    console.log(endDay);
  
    try {
      const salesData = await invoiceModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDay, $lte: endDay },
            invoiceType: 'Sale',
          },
        },
        { $unwind: "$products" },
        {
          $group: {
            _id: "$products.category",
            totalSold: {
              $sum: {
                $multiply: [
                  { $toDouble: "$products.quantity" },
                  { $toDouble: "$products.amount" },
                ],
              },
            },
          },
        },
      ]); //sales data aggregation finished
  
      const returnData = await invoiceModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDay, $lte: endDay },
            invoiceType: 'SalesReturn',
          },
        },
        { $unwind: "$products" },
        {
          $group: {
            _id: "$products.category",
            totalReturned: {
              $sum: {
                $multiply: [
                  { $toDouble: "$products.quantity" },
                  { $toDouble: "$products.amount" },
                ],
              },
            },
          },
        },
      ]); //return data aggregation finished
  
      // Calculate net revenue for each category
      const data = salesData.map((salesItem) => {
        const returnItem = returnData.find(
          (item) => item._id === salesItem._id
        );
        const totalReturned = returnItem ? returnItem.totalReturned : 0;
        return {
          category: salesItem._id,
          netRevenue: salesItem.totalSold - totalReturned,
        };
      });
  
      // No data found
      if (!data.length) {
        return res.status(404).json({
          success: false,
          message: `No data found for ${timeRange}`,
        });
      }
  
      // Send the data
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      // Catch any error
      console.error(error);
      return res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? error.message : 'Server error',
      });
    }
  };


export const getStockData = async (req, res) => {
  try {

    const data = await productModel.aggregate([
      {
        $group: {
          _id: "$category",
          totalStock: {
            $sum: {
              $multiply: ["$quantity", "$price"]
            }
          }
        }
      }
    ]);
    

    // No data found
    if (!data.length) {
        return res.status(404).json({
            success: false,
            message: "No data found"
        });
    }

    // Send the data
    return res.status(200).json({
        success: true,
        data
    });

} catch (error) {
    // Catch any error
    console.error(error);
    return res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
}
}

export const getFinancialData = async (req, res) => {
  try{
    const receivablesData = await clientModel.aggregate([
      {
          $match: {
              clientType: 'Customer'
          }
      },
      {
          $group: {
              _id: null,
              receivables: { $sum: '$totalAmountToPay' },
          }
      }
  ]);
  const payablesData = await clientModel.aggregate([
    {
        $match: {
            clientType: 'Merchant'
        }
    },
    {
        $group: {
            _id: null,
            payables: { $sum: '$totalAmountToPay' },
        }
    }
]);

const totalSalesData = await invoiceModel.aggregate([
  {
    $match: {
      invoiceType: 'Sale'
    }
  },
  {
    $group: {
      _id: null,
      totalSales: { $sum: '$totalAmount' },
    }
  }
]);

const totalSalesReturnData = await invoiceModel.aggregate([
  {
    $match: {
      invoiceType: 'SalesReturn'
    }
  },
  {
    $group: {
      _id: null,
      totalSalesReturn: { $sum: '$totalAmount' },
    }
  }
]);

const totalPurchaseData = await invoiceModel.aggregate([
  {
    $match: {
      invoiceType: 'Purchase'
    }
  },
  {
    $group: {
      _id: null,
      totalPurchase: { $sum: '$totalAmount' },
    }
  }
]);

const totalPurchaseReturnData = await invoiceModel.aggregate([
  {
    $match: {
      invoiceType: 'PurchasesReturn'
    }
  },
  {
    $group: {
      _id: null,
      totalPurchaseReturn: { $sum: '$totalAmount' },
    }
  }
]);



        return res.status(200).json({
          success: true,
          totalReceivables:receivablesData.length? receivablesData[0].receivables:0,
          totalPayables: payablesData.length?payablesData[0].payables:0,
          totalSales: totalSalesData[0]?.totalSales - totalSalesReturnData[0]?.totalSalesReturn || 0,
          totalPurchase:totalPurchaseData[0]?.totalPurchase - totalPurchaseReturnData[0]?.totalPurchaseReturn || 0
          
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
}
}

export const getCashFlowData = async (req, res) => {
  try {
    const now = new Date();
    const fiveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 4, 1);

    // Aggregate Cash In from transactions
    const cashInData = await transactionModel.aggregate([
      {
        $match: {
          createdAt: { $gte: fiveMonthsAgo },
          $or: [{ transactionType: 'Sale' }, { transactionType: 'PaymentIn' }]
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          cashIn: {
            $sum: {
              $cond: [
                { $eq: ["$transactionType", "Sale"] },
                "$receviedAmount",
                "$amount"
              ]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Aggregate Cash Out from transactions
    const cashOutTransactionsData = await transactionModel.aggregate([
      {
        $match: {
          createdAt: { $gte: fiveMonthsAgo },
          $or: [{ transactionType: 'Purchase' }, { transactionType: 'SalesReturn' }, { transactionType: 'PaymentOut' }]
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          cashOut: {
            $sum: {
              $cond: [
                { $in: ["$transactionType", ["Purchase", "SalesReturn"]] },
                "$receviedAmount",
                "$amount"
              ]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    // Aggregate Cash Out from expenses
    const cashOutExpensesData = await expenseModel.aggregate([
      {
        $match: {
          createdAt: { $gte: fiveMonthsAgo }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          cashOut: { $sum: '$amount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

     // Merge Cash Out data from transactions and expenses
     let cashOutData = [...cashOutTransactionsData, ...cashOutExpensesData];

     // Group by month and sum up cashOut
    cashOutData = cashOutData.reduce((res, item) => {
      const existing = res.find(data => data._id === item._id);

      if (existing) {
        existing.cashOut += item.cashOut;
      } else {
        res.push(item);
      }

      return res;
    }, []);
    // Sort the cashOutData by month
    cashOutData.sort((a, b) => a._id - b._id);

   // Merge cashInData and cashOutData
  const cashFlowData = [...cashInData, ...cashOutData].reduce((acc, curr) => {
    const existingMonth = acc.find(item => item._id === curr._id);
    if (existingMonth) {
      existingMonth.cashIn = existingMonth.cashIn || curr.cashIn;
      existingMonth.cashOut = existingMonth.cashOut || curr.cashOut;
    } else {
      acc.push(curr);
    }
    return acc;
  }, []);

  // Sort the array by month
  cashFlowData.sort((a, b) => a._id - b._id);

  return res.status(200).json({
    success: true,
    cashFlowData
  });

  } catch (error) {
    // Catch any error
    console.error(error);
    return res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
}






