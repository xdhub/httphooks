var IncomingMessage = require('./IncomingMessage');
var ServerResponse = require('./ServerResponse');

function createHttpContextFromSocketIo(socket, request, responseCallback) {
    return null;
    var httpContext = {
        request: new IncomingMessage(request),
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
