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

var IncomingSocketMessage = require('../IncomingSocketMessage.js');
var ServerSocketResponse = require('../ServerSocketResponse.js');

var createHttpContextFromSocketJs = function (socket, request) {
    var httpContext = {
        request: new IncomingSocketMessage({ properties: request }),
        response: new ServerSocketResponse({
            socket: {
                context: socket,
                sendResponse: function (statusCode, headers, content, context) {
                    var response = { statusCode: statusCode, headers: headers, content: content };
                    context.write(JSON.stringify(response));
                },
                closedEventName: 'close'
            }
        })
    };
    return httpContext;
};

module.exports = {
    IncomingSocketMessage: IncomingSocketMessage,
    ServerSocketResponse: ServerSocketResponse,
    createHttpContextFromSocketJs: createHttpContextFromSocketJs
};
