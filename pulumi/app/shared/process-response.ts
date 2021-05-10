import * as awsx from '@pulumi/awsx';

export default function processResponse(
  statusCode: number,
  body: any
): awsx.apigateway.Response {
  const headers = { 'Content-Type': 'application/json' };
  const response = {
    statusCode,
    body: JSON.stringify(body),
    headers,
    isBase64Encoded: false,
  };

  return response;
}
