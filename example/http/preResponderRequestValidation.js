var http = require('http');
var httpHooks = new (require('../../lib/httphooks.js'))();
var urlPattern = '/*';

httpHooks.getPreResponder(urlPattern, function (hookContext, done) {
    // We expect that the request url have a query string containing a
    // key named 'name' and a corresponding string value. e.g. /?name=Elmar
    if (!hookContext.request.query.name
        || typeof hookContext.request.query.name !== 'string') {
        hookContext.response.statusCode = 400;
        hookContext.response.headers = { 'Content-Type': 'text/html' };
        hookContext.response.content = 'Bad Request';
    } else {
        hookContext.response.statusCode = 200;
    }

    done();
});

httpHooks.getInResponder(urlPattern, function (hookContext, done) {
    var content = 'Welcome to \'' + hookContext.request.url.path + '\'...'
        + '\r\nHello ' + hookContext.request.query.name + '! :)';
    hookContext.response.statusCode = 200;
    hookContext.response.headers = { 'Content-Type': 'text/html' };
    hookContext.response.content = content;
    done();
});

var server = http.createServer(function (request, response) {
    httpHooks.dispatch({request: request, response: response});
});

server.listen(process.env.PORT);
var url = 'http://' + process.env.IP + ':' + process.env.PORT;
console.log(url);
