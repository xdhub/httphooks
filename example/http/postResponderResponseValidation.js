var http = require('http');
var httpHooks = new (require('../../lib/httphooks.js'))();
var urlPattern = '/*';

httpHooks.getResponder(urlPattern, function (hookContext, done) {
    var myObject = {
        name: hookContext.request.query.name
    };

    var content = JSON.stringify(myObject);
    hookContext.response.statusCode = 200;
    hookContext.response.headers = { 'Content-Type': 'application/json' };
    hookContext.response.content = content;
    done();
});

httpHooks.getPostResponder(urlPattern, function (hookContext, done) {
    hookContext.response.statusCode = 200;
    if (hookContext.response.responses.length === 1) {
        // We expect that the request url have an object with a property 'name'
        // and a corresponding string value
        var response = hookContext.response.responses[0];
        var myObject = JSON.parse(response.content);

        if (!myObject
            || !myObject.name
            || typeof myObject.name !== 'string') {
            hookContext.response.statusCode = 500;
            hookContext.response.headers = { 'Content-Type': 'text/html' };
            hookContext.response.content = 'Internal Server Error';
        }
    }

    done();
});

var server = http.createServer(function (request, response) {
    httpHooks.dispatch({request: request, response: response});
});

server.listen(process.env.PORT);
var url = 'http://' + process.env.IP + ':' + process.env.PORT;
console.log(url);
