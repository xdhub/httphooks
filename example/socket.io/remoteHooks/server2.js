var io = require('socket.io').listen(8081);
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

io.on('connection', function (socket) {
    console.log('connection');
    httpHooks2.dispatch({socket: socket, framework: 'socket.io'});
});
