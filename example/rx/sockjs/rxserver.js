var http = require('http');
var rxsockjs = require('./rxsockjs.js');
var httpHooks = new (require('../../../lib/httphooks.js'))();

httpHooks.getResponder('/*', function (hookContext, done) {
    console.log(hookContext.request);
    var content = 'Welcome to \'' + hookContext.request.url.path + '\'... Hello world! :)';
    hookContext.setResponse(200, { 'Content-Type': 'text/html' }, content);
    done();
});

var serverObservable = rxsockjs.createServer();
var httpHooksObserver = httpHooks.asObserver();
var requestSubscription = serverObservable.subscribe(httpHooksObserver);

var httpServer = http.createServer(function (request, response) {
    console.log('httpServer: Request received!');
});

httpServer.on('upgrade', function (request, response) {
    console.log('httpServer: upgrade');
    response.end();
});

httpServer.listen(process.env.PORT);
serverObservable.server.installHandlers(httpServer);
