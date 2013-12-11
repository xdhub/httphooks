var http = require('http');
var request = require('request');
var httpHooks = new (require('../../lib/httphooks.js'))();

httpHooks.getInResponder('/*', function (hookContext, done) {
    request('http://www.google.com', function (error, response, body) {
        hookContext.response.statusCode = response.statusCode;
        if (!error && response.statusCode === 200) {
            hookContext.response.headers = { 'Content-Type': 'text/html' };
            hookContext.response.content = 'Welcome to \'' + hookContext.request.url.path + '\'... Hello world! :)';
            done();
        } else {
            done();
        }
    });
});

var server = http.createServer(function (request, response) {
    httpHooks.dispatch({request: request, response: response});
});

server.listen(process.env.PORT);
console.log(process.env.IP + ':' + process.env.PORT);
