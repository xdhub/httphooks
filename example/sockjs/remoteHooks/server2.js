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

var http = require('http');
var sockjs = require('sockjs');
var httpHooks2 = new (require('../../../lib/httphooks.js'))();

httpHooks2.getRequestListener('/remote/hook', function (hookContext, done) {
    console.log('Incoming request to ' + hookContext.request.url.path);
    console.log('Method: ' + JSON.stringify(hookContext.request.method));
    console.log('Headers: ' + JSON.stringify(hookContext.request.headers));
    console.log('Content: ' + JSON.stringify(hookContext.request.content));
    done();
});

httpHooks2.getResponder('/remote/hook', function (hookContext, done) {
    hookContext.setResponse(
        200,
        { 'Content-Type': 'text/html' },
        'Hello from \'' + hookContext.request.url.path + '\'! :)');
    done();
});

var sockjsServer2 = sockjs.createServer({ sockjs_url: 'http://cdn.sockjs.org/sockjs-0.3.min.js' });
sockjsServer2.on('connection', function (connection) {
    console.log('sockjsServe2: connection');
    httpHooks2.dispatch({ socket: connection, framework: 'sockjs' });
});

var httpServer2 = http.createServer(function (request, response) {
    console.log('httpServer2: Request received!');
});

httpServer2.on('upgrade', function (request, response) {
    console.log('httpServer2: upgrade');
    response.end();
});

httpServer2.listen(8081);
sockjsServer2.installHandlers(httpServer2);
