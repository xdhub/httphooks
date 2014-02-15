//
// Copyright (c) Microsoft and contributors.  All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

/**
 * @title HookContextResponse Reference
 */

var isValid = function (response) {
    return typeof response === 'object' && response !== null
        && typeof response.statusCode === 'number' && response.statusCode > 0
        && typeof response.headers === 'object' && response.headers !== null
        && typeof response.content === 'string';
};

var isSuccessfulStatusCode = function (statusCode) {
    return statusCode === 200 || statusCode === 201 // OK or Created or
        || statusCode === 202 || statusCode === 203 // Accepted or Non-Authoritative Information or
        || statusCode === 204 || statusCode === 205 // No Content or Reset Content or
        || statusCode === 206;                      // Partial Content
};

function convertContentToString(content) {
    var contentType = content instanceof Buffer ? 'buffer' : typeof content;
    if (contentType === 'undefined') {
        content = '';
    } else if (contentType === 'buffer') {
        content = content.toString();
    } else if (contentType === 'object') {
        content = JSON.stringify(content);
    }

    return content;
}

/**
 * Create an HookContextResponse object
 * @class HookContextResponse
 * @member {number} statusCode The HTTP status code for the response.
 * @member {object} headers The response headers as an object.
 * @member {string} content The response content or body.
 */
/**
 * Determines whether or not the provided status code is successful.
 * @method isSuccess
 * @returns {boolean} True if the status code is successful; otherwise, false.
 */
var createResponse = function (statusCode, headers, content) {
    return {
        statusCode: statusCode || -1,
        headers: headers || {},
        content: convertContentToString(content),
        isSuccess: function () {
            return isSuccessfulStatusCode(this.statusCode);
        }
    };
};

module.exports = {
    isValid: isValid,
    createResponse: createResponse,
    isSuccessfulStatusCode: isSuccessfulStatusCode
};
