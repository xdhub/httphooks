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

var io = require('socket.io').listen(parseInt(process.env.PORT));
var httpHooks = new (require('../../lib/httphooks.js'))();

httpHooks.getResponder('/*', function (hookContext, done) {
    var content = 'Welcome to \'' + hookContext.request.url.path + '\'... Hello world! :)';
    hookContext.setResponse(200, { 'Content-Type': 'text/html' }, content);
    done();
});

io.on('connection', function (socket) {
    httpHooks.dispatch({socket: socket, framework: 'socket.io'});
});

console.log(process.env.IP + ':' + process.env.PORT);
