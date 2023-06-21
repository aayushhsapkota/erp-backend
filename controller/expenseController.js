import expenseModel from "../models/expenseModel.js";
import { getPaginatedData } from "../Utils/pagination.js";
import NepaliDate from 'nepali-date-converter';

export const getExpense = async (req, res) => {
  console.log(req.query);
  try {
    const {
      page,
      searchBy: { name, anything },
      filterBy,
      sortBy,
      limit,
      date: { startDate, endDate },
    } = req.query;

    let docxLimit = parseInt(limit) || 8;

    let regexSearch = name;
    let regexFilter = filterBy;
    let regexAnything = anything;

    let sort = parseInt(sortBy);
    if (sort === 1) {
      sort = { createdAt: -1 };
    } else if (sort === 2) {
      sort = { title: 1 };
    } else if (sort === 3) {
      sort = { title: -1 };
    } else if (sort === 4) {
      sort = { createdAt: 1 };
    }
    if (regexSearch) {
      regexSearch = new RegExp(regexSearch, "i");
    }
    if (regexFilter) {
      regexFilter = new RegExp(regexFilter, "i");
    }
    let OrCondition = [];
    if (regexAnything) {
      regexAnything = new RegExp(regexAnything, "i");
      OrCondition = [
        {
          brand: regexAnything,
        },
        {
          itemCode: regexAnything,
        },
      ];
    }
    const { data, pageCount } = await getPaginatedData({
      page: page,
      limit: docxLimit,
      modelName: expenseModel,
      inside: OrCondition,
      mainSearch: regexSearch ? { name: "title", value: regexSearch } : "",

      filterBy: regexFilter ? { name: "category", value: regexFilter } : "",
      startDate: startDate,
      endDate: endDate,
      oneAndCondition: [],
      sortBy: sort,
    });
    res.status(200).json({ data, pageCount });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createExpense = async (req, res) => {
  const nepaliDate= new NepaliDate();
  const formattedDate = nepaliDate.format('YYYY-MM-DD');
 
  const { title, image, category, price, remarks} = req.body;
 
  try {
    if (!title) {
      return res.status(400).json({
        message: "Please provide all required fields",
      });
    }
    if (!price) {
      return res.status(400).json({
        message: "Please provide a price",
      });
    }
    const expenseData = new expenseModel({
      title,
      image,
      category,
      amount:price,
      remarks,
      createdDate: formattedDate
    
    });
    

    const savedExpense = await expenseData.save();
    console.log(savedExpense);
    res.status(200).json({
      data: savedExpense,
      message: `${savedExpense.title} created successfully`,
    });
  } catch (error) {
    res.json({
      message: error.message,
    });
  }
};



export const updateExpenseById = async (req, res) => {
  const { id } = req.params;
  const { title, image, category, price, remarks } = req.body;
  try {
    if (!title) {
      return res.status(400).json({
        message: "Please provide all required fields",
      });
    }
    if (!price) {
      return res.status(400).json({
        message: "Please provide a price",
      });
    }
    const updatedExpense = await expenseModel.findByIdAndUpdate(
      id,
      {
        title,
        image,
        category,
        amount:price,
        remarks,
      },
      { new: true }
    );
    res.status(200).json({
      data: updatedExpense,
      message: `${updatedExpense.title} updated successfully`,
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const deleteExpenseById = async (req, res) => {
  const { id } = req.params;
  try {
    // await deleteTransactionByProductID(id);
    await expenseModel.findByIdAndDelete(id);
    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getExpenseById = async (req, res) => {
  const { id } = req.params;
  try {
    const ExpenseById = await expenseModel.findById(id);
    const title = ExpenseById.title;
    res.json({ data: ExpenseById, message: "Expense " + title });
  } catch (error) {
    res.status(404).json({ message: error });
  }
};

export const getFilterExpense = async (req, res) => {
  // try {
  //   const data = await productModel.find({}).select("brand category ");

  //   const pages = await productModel.find().countDocuments();
  //   const limit = 8;
  //   const totalPages = Math.ceil(pages / limit);

  //   const pageArray = [];
  //   for (let i = 1; i <= totalPages; i++) {
  //     pageArray.push(i);
  //   }
  //   // const brand = data.map((item) => item.brand);
  //   const category = data.map((item) => item.category);
  //   // const allBrand = brand.reduce((acc, val) => acc.concat(val), []);
  //   const allCategory = category.reduce((acc, val) => acc.concat(val), []);
  //   // const brandFilter = allBrand.filter(
  //   //   (item) => item !== undefined && item !== null
  //   // );
  //   const categoryFilter = allCategory.filter(
  //     (item) => item !== undefined && item !== null
  //   );
  //   // const brandCapatalize = brandFilter.map(
  //   //   (item) => item.charAt(0).toUpperCase() + item.slice(1)
  //   // );
  //   const categoryCapatalize = categoryFilter.map(
  //     (item) => item.charAt(0).toUpperCase() + item.slice(1)
  //   );
  //   // const uniqueBrand = [...new Set(brandCapatalize)];
  //   const uniqueCategory = [...new Set(categoryCapatalize)];
  //   res.json({
  //     data: {
  //       // brand: uniqueBrand,
  //       category: uniqueCategory,
  //       pageNumbers: pageArray,
  //     },
  //   });
  // } catch (error) {
  //   res.status(404).json({ message: error.message });
  // }
};
