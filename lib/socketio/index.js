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

var IncomingSocketMessage = require('../IncomingSocketMessage.js');
var ServerSocketResponse = require('../ServerSocketResponse.js');

var createHttpContextFromSocketIo = function (socket, request, responseCallback) {
    socket.responseCallback = responseCallback;
    var httpContext = {
        request: new IncomingSocketMessage({ properties: request }),
        response: new ServerSocketResponse({
            socket: {
                context: socket,
                sendResponse: function (statusCode, headers, content, context) {
                    var response = { statusCode: statusCode, headers: headers, content: content };
                    context.responseCallback(response);
                },
                closedEventName: 'disconnect'
            }
        })
    };
    return httpContext;
}

module.exports = {
    IncomingSocketMessage: IncomingSocketMessage,
    ServerSocketResponse: ServerSocketResponse,
    createHttpContextFromSocketIo: createHttpContextFromSocketIo
};
