"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const aws_sdk_1 = require("aws-sdk");
const uuid = require("uuid");
const dynamo = new aws_sdk_1.DynamoDB.DocumentClient();
const TableName = process.env.DYNAMO_TABLE_NAME;
const snsArn = process.env.SNS_TOPIC_ARN;
const authorizationParam = process.env.AUTHORIZATION;
function processResponse(statusCode, body) {
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
const handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let eventBody = event.body;
        if (event.isBase64Encoded) {
            const buffer = Buffer.from(eventBody, 'base64');
            eventBody = buffer.toString('UTF-8');
        }
        const { name, location, rating, shouldTriggerDeploy, authorization, } = JSON.parse(eventBody);
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
        yield dynamo.put(params).promise();
        let didTriggerDeploy = false;
        if (shouldTriggerDeploy) {
            try {
                const Sns = new aws_sdk_1.SNS();
                const params = {
                    Message: 'Deploy',
                    TopicArn: snsArn,
                };
                yield Sns.publish(params).promise();
                didTriggerDeploy = true;
            }
            catch (error) {
                console.log('Error triggering deploy', error);
            }
        }
        return processResponse(200, { didTriggerDeploy });
    }
    catch (error) {
        return processResponse(400, error);
    }
});
exports.handler = handler;
//# sourceMappingURL=index.js.map