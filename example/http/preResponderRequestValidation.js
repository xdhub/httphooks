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
    // We expect that the request url have a query string containing a
    // key named 'name' and a corresponding string value. e.g. /?name=Elmar
    if (!hookContext.request.query.name
        || typeof hookContext.request.query.name !== 'string') {
        hookContext.setResponse(400, { 'Content-Type': 'text/html' }, 'Bad Request');
    } else {
        hookContext.setResponse(200);
    }

    done();
});

httpHooks.getResponder(urlPattern, function (hookContext, done) {
    var content = 'Welcome to \'' + hookContext.request.url.path + '\'...'
        + '\r\nHello ' + hookContext.request.query.name + '! :)';
    hookContext.setResponse(200, { 'Content-Type': 'text/html' }, content);
    done();
});

var server = http.createServer(function (request, response) {
    httpHooks.dispatch({request: request, response: response});
});

server.listen(process.env.PORT);
var url = 'http://' + process.env.IP + ':' + process.env.PORT;
console.log(url);
