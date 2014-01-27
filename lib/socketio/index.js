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
