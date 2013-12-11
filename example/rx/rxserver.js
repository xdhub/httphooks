var rxhttp = require('./rxhttp');
var httpHooks = new (require('../../lib/httphooks.js'))();

var serverObservable = rxhttp.createServer();
serverObservable.server.listen(process.env.PORT);
console.log(process.env.IP + ':' + process.env.PORT);

httpHooks.getInResponder('/*', function (hookContext, done) {
    hookContext.response.statusCode = 200;
    hookContext.response.headers = { 'Content-Type': 'text/html' };
    hookContext.response.content = 'Welcome to \'' + hookContext.request.url.path + '\'... Hello world! :)';
    done();
});
httpHooks.getInResponder('/test', function (hookContext, done) {
    hookContext.response.statusCode = 200;
    hookContext.response.headers = { 'Content-Type': 'text/html' };
    hookContext.response.content = 'Welcome to \'' + hookContext.request.url.path + '\'... Hello world! :)';
    done();
});
var httpHooksObserver = httpHooks.asObserver();
var requestSubscription2 = serverObservable.subscribe(
    function (x) {
        console.log('Next: ' + x);
    },
    function (err) {
        console.log('Error: ' + err);
    },
    function () {
        console.log('Completed');
    });
var requestSubscription = serverObservable.subscribe(httpHooksObserver)
