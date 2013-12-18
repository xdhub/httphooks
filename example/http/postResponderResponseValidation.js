var http = require('http');
var httpHooks = new (require('../../lib/httphooks.js'))();
var urlPattern = '/*';

httpHooks.getResponder(urlPattern, function (hookContext, done) {
    var myObject = {
        name: hookContext.request.query.name
    };

    var content = JSON.stringify(myObject);
    hookContext.setResponse(200, { 'Content-Type': 'application/json' }, content);
    done();
});

httpHooks.getPostResponder(urlPattern, function (hookContext, done) {
    hookContext.setResponse(200);
    if (hookContext.responseQueue.length === 1) {
        // We expect that the request url have an object with a property 'name'
        // and a corresponding string value
        var response = hookContext.responseQueue[0];
        var myObject = JSON.parse(response.content);

        if (!myObject
            || !myObject.name
            || typeof myObject.name !== 'string') {
            hookContext.setResponse(500, { 'Content-Type': 'text/html' }, 'Internal Server Error');
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
