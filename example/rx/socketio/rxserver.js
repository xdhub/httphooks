var rxsocketio = require('./rxsocketio');
var serverObservable = rxsocketio.createServer(parseInt(process.env.PORT));
var httpHooks = new (require('../../../lib/httphooks.js'))();

httpHooks.getResponder('/*', function (hookContext, done) {
    var content = 'Welcome to \'' + hookContext.request.url.path + '\'... Hello world! :)';
    hookContext.setResponse(200, { 'Content-Type': 'text/html' }, content);
    done();
});

var httpHooksObserver = httpHooks.asObserver();
var requestSubscription = serverObservable.subscribe(httpHooksObserver);

console.log(process.env.IP + ':' + process.env.PORT);
