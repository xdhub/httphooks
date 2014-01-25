var IncomingMessage = require('./IncomingMessage');
var ServerResponse = require('./ServerResponse');

var createHttpContextFromSocketIo = function (socket, request, responseCallback) {
    var httpContext = {
        request: new IncomingMessage({properties: request}),
        response: new ServerResponse({
            socketContext: socket,
            socketResponseCallback: responseCallback
        })
    };
    return httpContext;
}

module.exports = {
    IncomingMessage: IncomingMessage,
    ServerResponse: ServerResponse,
    createHttpContextFromSocketIo: createHttpContextFromSocketIo
};
