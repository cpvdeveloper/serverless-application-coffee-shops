const processResponse = (statusCode, body) => {
  const headers = { 'Content-Type': 'application/json' };
  const response = {
    statusCode,
    body: JSON.stringify(body),
    headers,
    isBase64Encoded: false,
  };

  return response;
};

module.exports = processResponse;
