var http = require('http');
var httpHooks = new (require('../../lib/httphooks.js'))();
var urlPattern = '/*';

httpHooks.getPreResponder(urlPattern, function (hookContext, done) {
    if (!hookContext.request.query.name
        || typeof hookContext.request.query.name !== 'string') {
        hookContext.setResponse(400, { 'Content-Type': 'text/html' }, 'Bad Request');
    } else {
        // If the incoming request is valid, we augment the content or body
        // of the request to include a user JSON object and keep the same
        // incoming headers
        var content = JSON.stringify({
            name: hookContext.request.query.name,
            normalizedName: hookContext.request.query.name.toLowerCase()
        });
        hookContext.replaceRequest(hookContext.request.headers, content);
    }

    done();
});

httpHooks.getResponder(urlPattern, function (hookContext, done) {
    var user = JSON.parse(hookContext.request.content);
    var content = 'Welcome to \'' + hookContext.request.url.path + '\'...'
        + '\r\nHello ' + user.normalizedName + '! :)';
    hookContext.setResponse(200, { 'Content-Type': 'text/html' }, content);
    done();
});

var server = http.createServer(function (request, response) {
    httpHooks.dispatch({request: request, response: response});
});

server.listen(process.env.PORT);
var url = 'http://' + process.env.IP + ':' + process.env.PORT;
console.log(url);
