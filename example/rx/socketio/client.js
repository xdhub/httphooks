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

var socket = require('socket.io-client').connect('http://' + process.env.IP + ':' + process.env.PORT);
var request = {
    method: 'GET',
    url: '/hook',
    headers: {
        'Content-Type': 'application/json'
    },
    content: JSON.stringify({
        message: 'Hello World'
    })
};
socket.on('connect', function () {
    socket.emit(
        'request',
        request,
        function (response) {
            console.log('Response: ' + JSON.stringify(response));
            socket.disconnect();
        });
});
socket.on('disconnect', function () {
    console.log('disconnect');
});
socket.on('error', function (error) {
    console.log('error: ' + error);
});
