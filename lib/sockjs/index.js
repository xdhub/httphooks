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
