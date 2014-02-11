var http = require('http');
var request = require('request');
var httpHooks = new (require('../../lib/httphooks.js'))();

httpHooks.getResponder('/*', function (hookContext, done) {
    request('http://www.google.com', function (error, response, body) {
        if (!error && response.statusCode === 200) {
            hookContext.setResponse(
                response.statusCode,
                { 'Content-Type': 'text/html' },
                'Welcome to \'' + hookContext.request.url.path + '\'... Hello world! :)');
        } else {
            hookContext.setResponse(response.statusCode);    
        }
        done();
    });
});

var server = http.createServer(function (request, response) {
    httpHooks.dispatch({request: request, response: response});
});

server.listen(process.env.PORT);
console.log(process.env.IP + ':' + process.env.PORT);