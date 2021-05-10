import { DynamoDB, SNS } from 'aws-sdk';
import * as awsx from '@pulumi/awsx';
import * as uuid from 'uuid';

const dynamo = new DynamoDB.DocumentClient();

const TableName = process.env.DYNAMO_TABLE_NAME as string;
const snsArn = process.env.SNS_TOPIC_ARN as string;
const authorizationParam = process.env.AUTHORIZATION;

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

export const handler = async (event: awsx.apigateway.Request) => {
  try {
    let eventBody = event.body as string;
    if (event.isBase64Encoded) {
      const buffer = Buffer.from(eventBody, 'base64');
      eventBody = buffer.toString('UTF-8');
    }

    const {
      name,
      location,
      rating,
      shouldTriggerDeploy,
      authorization,
    } = JSON.parse(eventBody);

    if (!authorization || authorization !== authorizationParam) {
      return processResponse(401, 'Not authorized');
    }

    const params = {
      TableName,
      Item: {
        id: uuid.v1(),
        createdAt: new Date().getTime(),
        name,
        location,
        rating,
      },
    };

    await dynamo.put(params).promise();

    let didTriggerDeploy = false;
    if (shouldTriggerDeploy) {
      try {
        const Sns = new SNS();
        const params = {
          Message: 'Deploy',
          TopicArn: snsArn,
        };

        await Sns.publish(params).promise();
        didTriggerDeploy = true;
      } catch (error) {
        console.log('Error triggering deploy', error);
      }
    }
    return processResponse(200, { didTriggerDeploy });
  } catch (error) {
    return processResponse(400, error);
  }
};
