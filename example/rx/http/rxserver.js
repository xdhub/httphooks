var rxhttp = require('./rxhttp');
var httpHooks = new (require('../../../lib/httphooks.js'))();

var serverObservable = rxhttp.createServer();
serverObservable.server.listen(process.env.PORT);
console.log(process.env.IP + ':' + process.env.PORT);

httpHooks.getResponder('/*', function (hookContext, done) {
    var content = 'Welcome to \'' + hookContext.request.url.path + '\'... Hello world! :)';
    hookContext.setResponse(200, { 'Content-Type': 'text/html' }, content);
    done();
});
httpHooks.getResponder('/test', function (hookContext, done) {
    var content = 'Welcome to \'' + hookContext.request.url.path + '\'... Hello world! :)';
    hookContext.setResponse(200, { 'Content-Type': 'text/html' }, content);
    done();
});

var httpHooksObserver = httpHooks.asObserver();
var requestSubscription = serverObservable.subscribe(httpHooksObserver);
