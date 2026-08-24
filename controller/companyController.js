import companyModel from "../models/companyModel.js";

export const getCompany = async (req, res) => {
  try {
    let company = await companyModel.findOne();
    if (!company) {
      company = await companyModel.create({});
    }
    res.status(200).json({ data: company });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateCompany = async (req, res) => {
  const {
    companyName,
    billingAddress,
    companyEmail,
    companyPhone,
    companyMobile,
    image,
  } = req.body;

  try {
    const company = await companyModel.findOneAndUpdate(
      {},
      {
        companyName,
        billingAddress,
        companyEmail,
        companyPhone,
        companyMobile,
        image,
      },
      { new: true, upsert: true, runValidators: true }
    );
    res
      .status(200)
      .json({ data: company, message: "Business profile updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
