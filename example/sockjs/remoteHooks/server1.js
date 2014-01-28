var http = require('http');
var sockjs = require('sockjs');
var httpHooks1 = new (require('../../../lib/httphooks.js'))();

httpHooks1.getResponder(
    '/local/hook',
    {
        uri: 'ws://localhost:8081/remote/hook',
        socketFramework: 'sockjs',
        hookFilter: ['responder'] // Used to filter and only trigger the responder hook type(s)
    });

var sockjsServer1 = sockjs.createServer({ sockjs_url: 'http://cdn.sockjs.org/sockjs-0.3.min.js' });
sockjsServer1.on('connection', function (connection) {
    console.log('sockjsServer1: connection');
    httpHooks1.dispatch({ socket: connection, framework: 'sockjs' });
});

var httpServer1 = http.createServer(function (request, response) {
    console.log('httpServer1: Request received!');
});

httpServer1.on('upgrade', function (request, response) {
    console.log('httpServer1: upgrade');
    response.end();
});

httpServer1.listen(8080);
sockjsServer1.installHandlers(httpServer1);
