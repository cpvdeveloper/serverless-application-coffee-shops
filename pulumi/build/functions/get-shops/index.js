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
const dynamo = new aws_sdk_1.DynamoDB.DocumentClient();
const TableName = process.env.DYNAMO_TABLE_NAME;
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
const handler = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield dynamo.scan({ TableName }).promise();
        return processResponse(200, data);
    }
    catch (error) {
        return processResponse(400, error);
    }
});
exports.handler = handler;
//# sourceMappingURL=index.js.map