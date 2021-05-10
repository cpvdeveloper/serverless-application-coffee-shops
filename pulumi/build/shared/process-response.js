"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function processResponse(statusCode, body) {
    const headers = { 'Content-Type': 'application/json' };
    const response = {
        statusCode,
        body: JSON.stringify(body),
        headers,
        isBase64Encoded: false,
    };
    return response;
}
exports.default = processResponse;
//# sourceMappingURL=process-response.js.map