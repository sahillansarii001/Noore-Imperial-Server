export const success = (res, data = null, message = 'Success', code = 200, pagination = undefined) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(code).json(response);
};

export const error = (res, message = 'Internal Server Error', code = 500, errors = undefined) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(code).json(response);
};
