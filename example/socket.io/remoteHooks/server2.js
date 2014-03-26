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

var io2 = require('socket.io').listen(8081);
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

io2.on('connection', function (socket) {
    console.log('io2: connection');
    httpHooks2.dispatch({socket: socket, framework: 'socket.io'});
});
