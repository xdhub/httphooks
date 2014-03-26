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
var sockjs = require('sockjs');
var httpHooks = new (require('../../lib/httphooks.js'))();

httpHooks.getResponder('/*', function (hookContext, done) {
    var content = 'Welcome to \'' + hookContext.request.url.path + '\'... Hello world! :)';
    hookContext.setResponse(200, { 'Content-Type': 'text/html' }, content);
    done();
});

var sockjsServer = sockjs.createServer({ sockjs_url: 'http://cdn.sockjs.org/sockjs-0.3.min.js' });
sockjsServer.on('connection', function (connection) {
    console.log('sockjsServer: connection');
    console.log('connection.readable = ' + connection.readable);
    console.log('connection.writable = ' + connection.writable);
    console.log('connection.remoteAddress = ' + connection.remoteAddress);
    console.log('connection.remotePort = ' + connection.remotePort);
    console.log('connection.address = ' + JSON.stringify(connection.address));
    console.log('connection.headers = ' + JSON.stringify(connection.headers));
    console.log('connection.url = ' + connection.url);
    console.log('connection.pathname = ' + connection.pathname);
    console.log('connection.prefix = ' + connection.prefix);
    console.log('connection.protocol = ' + connection.protocol);
    console.log('connection.readyState = ' + connection.readyState);
    httpHooks.dispatch({ socket: connection, framework: 'sockjs' });
});

var httpServer = http.createServer(function (request, response) {
    console.log('httpServer: Request received!');
});

httpServer.on('upgrade', function (request, response) {
    console.log('httpServer: upgrade');
    response.end();
});

httpServer.listen(process.env.PORT);
sockjsServer.installHandlers(httpServer);
