import { DynamoDB } from 'aws-sdk';
import * as awsx from '@pulumi/awsx';

const dynamo = new DynamoDB.DocumentClient();
const TableName = process.env.DYNAMO_TABLE_NAME as string;

function processResponse(
  statusCode: number,
  body: any
): awsx.apigateway.Response {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
  };
  const response = {
    statusCode,
    headers,
    isBase64Encoded: false,
    body: JSON.stringify(body),
  };

  return response;
}

export const handler = async () => {
  try {
    const data = await dynamo.scan({ TableName }).promise();
    return processResponse(200, data);
  } catch (error) {
    return processResponse(400, error);
  }
};
