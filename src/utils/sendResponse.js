export const sendResponse = (res, { statusCode = 200, success = true, message, data, meta }) => {
  const response = {
    success,
    message
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (meta !== undefined) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};
