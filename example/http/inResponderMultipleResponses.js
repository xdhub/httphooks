var http = require('http');
var httpHooks = new (require('../../lib/httphooks.js'))();
var urlPattern = '/*';

httpHooks.getPreResponder(urlPattern, function (hookContext, done) {
    console.log(typeof hookContext.request.query.number);
    if (!hookContext.request.query.number
        || typeof hookContext.request.query.number !== 'string'
        || isNaN(parseInt(hookContext.request.query.number, 10))) {
        hookContext.response.statusCode = 400;
        hookContext.response.headers = { 'Content-Type': 'text/html' };
        hookContext.response.content = 'Bad Request';
    } else {
        hookContext.response.statusCode = 200;
    }

    done();
});

httpHooks.getInResponder(urlPattern, function (hookContext, done) {
    var odd = {
        type: 'odd',
        numbers: []
    };

    var maxNumber = parseInt(hookContext.request.query.number, 10);
    for (var number = 1; number <= maxNumber; number++) {
        if ((number % 2) !== 0) {
            odd.numbers.push(number);
        }
    }

    var content = JSON.stringify(odd);
    hookContext.response.statusCode = 200;
    hookContext.response.headers = { 'Content-Type': 'application/json' };
    hookContext.response.content = content;
    done();
});

httpHooks.getInResponder(urlPattern, function (hookContext, done) {
    var even = {
        type: 'even',
        numbers: []
    };

    var maxNumber = parseInt(hookContext.request.query.number, 10);
    for (var number = 1; number <= maxNumber; number++) {
        if ((number % 2) === 0) {
            even.numbers.push(number);
        }
    }

    var content = JSON.stringify(even);
    hookContext.response.statusCode = 200;
    hookContext.response.headers = { 'Content-Type': 'application/json' };
    hookContext.response.content = content;
    done();
});

var server = http.createServer(function (request, response) {
    httpHooks.dispatch({request: request, response: response});
});

server.listen(process.env.PORT);
var url = 'http://' + process.env.IP + ':' + process.env.PORT;
console.log(url);
