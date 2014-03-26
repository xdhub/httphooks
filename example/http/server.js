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

var http = require('http');
var request = require('request');
var httpHooks = new (require('../../lib/httphooks.js'))();

httpHooks.getResponder('/*', function (hookContext, done) {
    request('http://www.google.com', function (error, response, body) {
        if (!error && response.statusCode === 200) {
            hookContext.setResponse(
                response.statusCode,
                { 'Content-Type': 'text/html' },
                'Welcome to \'' + hookContext.request.url.path + '\'... Hello world! :)');
        } else {
            hookContext.setResponse(response.statusCode);    
        }
        done();
    });
});

var server = http.createServer(function (request, response) {
    httpHooks.dispatch({request: request, response: response});
});

server.listen(process.env.PORT);
console.log(process.env.IP + ':' + process.env.PORT);