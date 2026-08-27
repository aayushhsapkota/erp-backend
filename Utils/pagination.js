export const getPaginatedData = async ({
  page,
  limit,
  modelName,
  inside,
  mainSearch = { name: "", value: "" },
  filterBy = { name: "", value: "" },
  sortBy = { createdAt: -1 },
  oneAndCondition = [],
}) => {
  try {
    const skip = (page - 1) * limit;
    let match = {};
    if (inside.length > 0) {
      match.$or = inside;
    }
    if (oneAndCondition.length > 0) {
      match.$and = oneAndCondition;
    }
    if (mainSearch.name) {
      match[mainSearch.name] = mainSearch.value;
    }
    if (filterBy.name) {
      match[filterBy.name] = filterBy.value;
    }
    const [filterValue, total] = await Promise.all([
      modelName.aggregate([
        { $match: match },
        { $sort: sortBy },
        { $skip: skip },
        { $limit: limit },
      ]),
      modelName.countDocuments(match),
    ]);
    const pageCount = Math.ceil(total / limit);
    return { data: filterValue, pageCount };
  } catch (err) {
    return { data: [], pageCount: 0 };
  }
};
