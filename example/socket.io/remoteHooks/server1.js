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
