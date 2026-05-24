export const getPagination = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

export const getPaginationMetadata = (total, page, limit) => {
  return {
    totalItems: parseInt(total),
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    limit: limit
  };
};
