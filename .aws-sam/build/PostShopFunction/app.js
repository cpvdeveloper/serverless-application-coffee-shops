const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient({ region: 'eu-west-2' });
const uuid = require('uuid');
const processResponse = require('./process-response');

const TableName = process.env.TABLE_NAME;
const snsArn = process.env.SNS_TOPIC_ARN;

exports.handler = async event => {
  try {
    const { name, location, rating, shouldTriggerDeploy } = event.body;

    const params = {
      Item: {
        id: uuid.v1(),
        createdAt: new Date().getTime(),
        name,
        location,
        rating,
      },
      TableName,
    };

    await dynamo.put(params).promise();

    let didTriggerDeploy = false;
    if (shouldTriggerDeploy) {
      try {
        const Sns = AWS.SNS();
        const params = {
          Message: 'Deploy',
          TopicArn: snsArn,
        };

        await Sns.publish(params).promise();
        didTriggerDeploy = true;
      } catch (err) {
        console.log('Error triggering deploy', err);
      }
    }
    return processResponse(200, { didTriggerDeploy });
  } catch (err) {
    return processResponse(400, err);
  }
};
