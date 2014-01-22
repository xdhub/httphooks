var http = require('http');
var HttpHooks = require('../../lib/httphooks.js');
var hookOptions = {
    defaultResponder: function (hookContext, done) {
        hookContext.setResponse(
            500,
            { 'Content-Type': 'text/html' },
            'Unable to access ' + hookContext.request.url.path
        );
        done();
    }
};
var httpHooks = new HttpHooks(hookOptions);
httpHooks.getResponder('/my/test/hook', function (hookContext, done) {
    hookContext.setResponse(
        200,
        { 'Content-Type': 'text/html' },
        'Welcome to my test hook!');
    done();
});

var server = http.createServer(function (request, response) {
    httpHooks.dispatch({request: request, response: response});
});

server.listen(process.env.PORT);
console.log(process.env.IP + ':' + process.env.PORT);
