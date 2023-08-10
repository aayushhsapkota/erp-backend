import invoiceModel from "../models/invoiceModel.js";
import expenseModel from "../models/expenseModel.js";
import productModel from "../models/productModel.js";
import clientModel from "../models/clientModel.js";
import transactionModel from "../models/allTransactionsModel.js";
import { response } from "express";
// import NepaliDate from 'nepali-date-converter';

const TIME_RANGES = {
  THIS_WEEK: "thisWeek",
  LAST_WEEK: "lastWeek",
  THIS_MONTH: "thisMonth",
  LAST_MONTH: "lastMonth",
  THIS_YEAR: "thisYear",
  LAST_YEAR: "lastYear",
};

const LENGTHS = {
  [TIME_RANGES.THIS_WEEK]: 7,
  [TIME_RANGES.LAST_WEEK]: 7,
  [TIME_RANGES.THIS_MONTH]: 5,
  [TIME_RANGES.LAST_MONTH]: 5,
  [TIME_RANGES.THIS_YEAR]: 4,
  [TIME_RANGES.LAST_YEAR]: 4,
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

  function getCurrentDayBounds() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return { startOfDay, endOfDay };
}

  

export const getRevenueData = async (req, res) => {
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

          // Create a default array for all weeks
          let result = Array.from({ length: LENGTHS[timeRange] }, (_, i) => ({
            _id: i + 1,
            totalSales: 0,
            totalMoneyReceived: 0
          }));

          
        if (data.length !==0) {
             // Update the result array with actual data
             for(let item of data) {
              const periodIndex = item._id - 1;
              result[periodIndex] = item;
            }
  
          };   
  
        // Send the data
        return res.status(200).json({
            success: true,
            data:result,
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

    const totalExpenseData = await expenseModel.aggregate([
      {
          $match:{
              createdAt: { $gte: startDay, $lte: endDay },
          }
      },
      {
          $group: {
              _id: null,
              totalExpense: { $sum: '$amount' },
          }
      }
  ]);

    // Send the data
    return res.status(200).json({
        success: true,
        data,
        totalExpenseData: totalExpenseData.length?totalExpenseData[0].totalExpense:0,

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
                // $multiply: [
                //   { $toDouble: "$products.quantity" },
                //   { $toDouble: "$products.amount" },
                // ],
                $multiply: [
                  {
                    $cond: {
                      if: { $eq: ["$products.quantity", ""] },
                      then: 0,
                      else: { $toDouble: "$products.quantity" }
                    }
                  },
                  {
                    $cond: {
                      if: { $eq: ["$products.amount", ""] },
                      then: 0,
                      else: { $toDouble: "$products.amount" }
                    }
                  }
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
                // $multiply: [
                //   { $toDouble: "$products.quantity" },
                //   { $toDouble: "$products.amount" },
                // ],
                $multiply: [
                  {
                    $cond: {
                      if: { $eq: ["$products.quantity", ""] },
                      then: 0,
                      else: { $toDouble: "$products.quantity" }
                    }
                  },
                  {
                    $cond: {
                      if: { $eq: ["$products.amount", ""] },
                      then: 0,
                      else: { $toDouble: "$products.amount" }
                    }
                  }
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
          name: salesItem._id,
          netRevenue: salesItem.totalSold - totalReturned,
        };
      });

      // Filter out items with null category
      const finalData = data.filter((item) => item.name !== null);
  
      // No data found
      if (!finalData.length) {
        return res.status(404).json({
          success: false,
          message: `No data found for ${timeRange}`,
        });
      }

          // Aggregation to calculate total amount for invoices of type "Sales"
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

    // Aggregation to calculate total returned amount for invoices of type "SalesReturn"
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

  const totalSales=totalData.length?totalData[0].totalSales:0;
  const totalReturned=totalReturnedData.length ? totalReturnedData[0].totalReturned : 0;
  
      // Send the data
      return res.status(200).json({
        success: true,
        finalData,
        totalRevenue:totalSales-totalReturned,
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

    const totalStock = await productModel.aggregate([
      {
        $group: {
          _id: null,
          totalValue: {
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
        data,
        totalStock: totalStock.length?totalStock[0].totalValue:0,
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

const customerOpeningBalance = await clientModel.aggregate([
  {
      $match: {
          clientType: 'Customer'
      }
  },
  {
      $group: {
          _id: null,
          totalOpenings: { $sum: '$openingBalance' },
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

const merchantOpeningBalance = await clientModel.aggregate([
  {
      $match: {
          clientType: 'Merchant'
      }
  },
  {
      $group: {
          _id: null,
          totalOpenings: { $sum: '$openingBalance' },
      }
  }
]);

const sales=totalSalesData[0]?.totalSales||0;
const purchase=totalPurchaseData[0]?.totalPurchase||0;
const salesReturn=totalSalesReturnData[0]?.totalSalesReturn||0;
const purchaseReturn=totalPurchaseReturnData[0]?.totalPurchaseReturn||0;

const customerOpenings=customerOpeningBalance[0]?.totalOpenings||0;
const merchantOpenings=merchantOpeningBalance[0]?.totalOpenings||0;

        return res.status(200).json({
          success: true,
          totalReceivables:receivablesData.length? receivablesData[0].receivables:0,
          totalPayables: payablesData.length?payablesData[0].payables:0,
          totalSales: sales-salesReturn+customerOpenings,//look how customerOpenings is added to totalSales 
          totalPurchase:purchase-purchaseReturn+merchantOpenings//look how merchantOpenings is added to totalPurchase 
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
  let cashFlowData = [...cashInData, ...cashOutData].reduce((acc, curr) => {
    const existingMonth = acc.find(item => item._id === curr._id);
    if (existingMonth) {
      existingMonth.cashIn = existingMonth.cashIn || curr.cashIn;
      existingMonth.cashOut = existingMonth.cashOut || curr.cashOut;
    } else {
      acc.push({
        _id: curr._id,
        cashIn: curr.cashIn || 0,
        cashOut: curr.cashOut || 0,
      });
    }
    return acc;
  }, []);

 // Fill in missing months
 for (let m = fiveMonthsAgo.getMonth(); m <= now.getMonth(); m++) {
  const existingMonth = cashFlowData.find(item => item._id === (m+1));
  if (!existingMonth) {
    cashFlowData.push({ _id: m+1, cashIn: 0, cashOut: 0 });
  }
}

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
export const getPurchaseData = async (req, res) => {
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
                  invoiceType: 'Purchase'
              }
          },
          {
              $group: {
                  _id: groupByPeriod[timeRange],
                  totalPurchase: { $sum: '$totalAmount' },
                  totalMoneyPaid: { $sum: '$paidAmount' }
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

    // Third Aggregation to calculate total returned amount for invoices of type "SalesReturn"
    const totalReturnedData = await invoiceModel.aggregate([
      {
          $match:{
              createdAt: { $gte: startDay, $lte: endDay },
              invoiceType: 'PurchaseReturn'
          }
      },
      {
          $group: {
              _id: null,
              totalReturned: { $sum: '$totalAmount' },
          }
      }
  ]);

        // Create a default array for all weeks
        let result = Array.from({ length: LENGTHS[timeRange] }, (_, i) => ({
          _id: i + 1,
          totalPurchase: 0,
          totalMoneyPaid: 0
        }));

        
      if (data.length !==0) {
           // Update the result array with actual data
           for(let item of data) {
            const periodIndex = item._id - 1;
            result[periodIndex] = item;
          }

        };   

      // Send the data
      return res.status(200).json({
          success: true,
          data:result,
          totalPurchase: totalData.length?totalData[0].totalPurchase:0,
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

export const getDayBookData = async (req, res) => {
  const { startOfDay, endOfDay } = getCurrentDayBounds();
console.log(startOfDay, endOfDay);

  try {
    const salesToday = await invoiceModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          invoiceType: "Sale",
        },
      },
      {
        $group: {
          _id: null,
          sales: { $sum: "$paidAmount" },
        },
      },
     
    ]);

    const esewaSalesToday = await invoiceModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          invoiceType: "Sale",
          note:{ $regex:/^esewa$/i},
        },
      },
      {
        $group: {
          _id: null,
          esewaSales: { $sum: "$paidAmount" },
        },
      },
     
    ]);

    const cashPurchaseToday = await invoiceModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          invoiceType: "Purchase",
        },
      },
      {
        $group: {
          _id: null,
          cashPurchase: { $sum: "$paidAmount" },
        },
      },
     
    ]);

    const totalExpenseToday = await expenseModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      {
        $group: {
          _id: null,
          totalExpense: { $sum: "$amount" },
        },
      },
    ]);

    const paymentInToday = await transactionModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          transactionType: "PaymentIn",
        },
      },
      {
        $group: {
          _id: null,
          paymentIn: { $sum: "$amount" },
        },
      },
    ]);

    const paymentOutToday = await transactionModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          transactionType: "PaymentOut",
        },
      },
      {
        $group: {
          _id: null,
          paymentOut: { $sum: "$amount" },
        },
      },
    ]);

    const salesTodayData= salesToday.length ? salesToday[0].sales:0;
    const esewaSalesTodayData= esewaSalesToday.length ? esewaSalesToday[0].esewaSales:0;

    
    // Send the data
    return res.status(200).json({
      success: true,
      cashSalesToday: salesTodayData-esewaSalesTodayData,
      esewaSalesToday: esewaSalesToday.length ? esewaSalesToday[0].esewaSales : 0,
      cashPurchaseToday: cashPurchaseToday.length ? cashPurchaseToday[0].cashPurchase : 0,
      totalExpenseToday: totalExpenseToday.length ? totalExpenseToday[0].totalExpense : 0,
      paymentInToday: paymentInToday.length ? paymentInToday[0].paymentIn : 0,
      paymentOutToday: paymentOutToday.length ? paymentOutToday[0].paymentOut : 0,     
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? error.message : "Server error",
    });
  }
};






