//
// Copyright (c) Microsoft Corporation. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// THIS CODE IS PROVIDED ON AN  *AS IS* BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT
// LIMITATION ANY IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR
// A PARTICULAR PURPOSE, MERCHANTABILITY OR NON-INFRINGEMENT.
//
// See the Apache Version 2.0 License for specific language governing
// permissions and limitations under the License.
//

/**
 * @title HookContextRequest Reference
 */

var querystring = require('querystring');
var url = require('url');
var clone = require('clone');

/**
 * Create an HookContextRequest object
 * @class HookContextRequest
 * @member {string} method The HTTP method of the request.
 * @member {Url} url The [url](http://nodejs.org/docs/latest/api/url.html) of the request.
 * @member {object} query The parsed query string as an object.
 * @member {object} headers The parsed headers as an object.
 * @member {string} content The request content or body.
 */
/**
 * Converts the provided content or body to a JSON object.
 * @method json
 * @returns {object} The JSON object representing the content.
 */
var createFromHttpRequest = function (request) {
    var uri = url.parse(request.url);
    var query = querystring.parse(uri.query);
    return {
        method: clone(request.method),
        url: clone(uri),
        query: clone(query),
        headers: clone(request.headers),
        content: clone(request.content),
        json: function () {
            return JSON.parse(this.content);
        }
    };
};

module.exports = {
    createFromHttpRequest: createFromHttpRequest
};
