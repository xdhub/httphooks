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

var io1 = require('socket.io').listen(8080);
var httpHooks1 = new (require('../../../lib/httphooks.js'))();

httpHooks1.getResponder(
    '/local/hook',
    {
        uri: 'ws://localhost:8081/remote/hook',
        socketFramework: 'socket.io',
        hookFilter: ['responder']
    });

io1.on('connection', function (socket) {
    console.log('io1: connection');
    httpHooks1.dispatch({socket: socket, framework: 'socket.io'});
});
