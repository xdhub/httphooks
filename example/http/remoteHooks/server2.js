var http = require('http');
var httpHooks2 = new (require('../../../lib/httphooks.js'))();

var remoteHookPath = '/remote/hook';
var remoteRequestListenerHook = {
    method: 'get',
    urlPattern: remoteHookPath,
    type: 'request-listener',
    callback: function (hookContext, done) {
        console.log('Incoming request to ' + hookContext.request.url.path);
        console.log('Method: ' + hookContext.request.method);
        console.log('Headers: ' + hookContext.request.headers);
        console.log('Content: ' + JSON.stringify(hookContext.request.content));
        done();
    }
};
httpHooks2.addHook(remoteRequestListenerHook);
var remoteResponderHook = {
    method: 'get',
    urlPattern: remoteHookPath,
    type: 'responder',
    callback: function (hookContext, done) {
        hookContext.setResponse(
            200,
            { 'Content-Type': 'text/html' },
            'Hello from \'' + hookContext.request.url.path + '\'! :)');
        done();
    }
};
httpHooks2.addHook(remoteResponderHook);

var server2 = http.createServer(function (request, response) {
    httpHooks2.dispatch({request: request, response: response});
});

server2.listen(8081);
