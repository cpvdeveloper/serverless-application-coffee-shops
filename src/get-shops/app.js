const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient({ region: 'eu-west-2' });
const processResponse = require('./process-response');
const TableName = process.env.TABLE_NAME;

const processSuccess = data => processResponse(200, data);
const processError = err => processResponse(400, err);

exports.handler = async event => {
  const { name } = event;
  if (name) {
    const params = {
      TableName,
      Key: { name },
    };

    try {
      const data = await dynamo.get(params).promise();
      return processSuccess(data);
    } catch (err) {
      return processError(err);
    }
  } else {
    const params = {
      TableName,
    };

    try {
      const data = await dynamo.scan(params).promise();
      return processSuccess(data);
    } catch (err) {
      return processError(err);
    }
  }
};
