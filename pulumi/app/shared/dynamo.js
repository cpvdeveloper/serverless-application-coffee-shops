const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient({ region: 'eu-west-2' });
const uuid = require('uuid');
const tableName = process.env.TABLE_NAME;

const getAllItems = () => {
  return dynamo
    .scan({ TableName: tableName })
    .promise()
    .then(
      items => {
        return items;
      },
      error => {
        return error;
      },
    );
};

const saveItem = item => {
  const params = {
    TableName: tableName,
    Item: {
      id: uuid.v1(),
      createdAt: new Date().getTime(),
      ...item,
    },
  };

  return dynamo
    .put(params)
    .promise()
    .then(
      () => {
        return params.Item;
      },
      error => {
        return error;
      },
    );
};

module.exports = {
  getAllItems,
  saveItem,
};
