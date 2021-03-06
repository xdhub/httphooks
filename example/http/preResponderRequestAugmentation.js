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
var httpHooks = new (require('../../lib/httphooks.js'))();
var urlPattern = '/*';

httpHooks.getPreResponder(urlPattern, function (hookContext, done) {
    if (!hookContext.request.query.name
        || typeof hookContext.request.query.name !== 'string') {
        hookContext.setResponse(400, { 'Content-Type': 'text/html' }, 'Bad Request');
    } else {
        // If the incoming request is valid, we augment the content or body
        // of the request to include a user JSON object and keep the same
        // incoming headers
        var content = JSON.stringify({
            name: hookContext.request.query.name,
            normalizedName: hookContext.request.query.name.toLowerCase()
        });
        hookContext.replaceRequest(hookContext.request.headers, content);
    }

    done();
});

httpHooks.getResponder(urlPattern, function (hookContext, done) {
    var user = JSON.parse(hookContext.request.content);
    var content = 'Welcome to \'' + hookContext.request.url.path + '\'...'
        + '\r\nHello ' + user.normalizedName + '! :)';
    hookContext.setResponse(200, { 'Content-Type': 'text/html' }, content);
    done();
});

var server = http.createServer(function (request, response) {
    httpHooks.dispatch({request: request, response: response});
});

server.listen(process.env.PORT);
var url = 'http://' + process.env.IP + ':' + process.env.PORT;
console.log(url);
