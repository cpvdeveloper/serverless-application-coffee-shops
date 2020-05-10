const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient({ region: 'eu-west-2' });
const uuid = require('uuid');
const processResponse = require('./process-response');

const TableName = process.env.TABLE_NAME;

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
        // await axios.post(`${process.env.NETLIFY_DEPLOY_URL}?trigger_title=add+shop+form`, {})
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
