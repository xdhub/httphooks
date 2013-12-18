# Common uses of in-responder hooks
**Author:** Elmar Langholz

## Multi-responder using in-responder hooks

This example demonstrates how multiple in-responders can generate a single multipart response. If the incoming request is valid, we proceed to execute the in-responders. The first will calculate all the odd numbers from one to the provided number in the query. The second will calculate all the even numbers from 1 to the provided number in the query. `httphooks` will then detect that there are multiple responses for the incoming request and in turn generate a single multipart response for which we can use the `HookContext.parseMultiResponse` method to parse it.

```js
var http = require('http');
var httpHooks = new (require('httphooks'))();
var urlPattern = '/*';

httpHooks.getPreResponder(urlPattern, function (hookContext, done) {
    console.log(typeof hookContext.request.query.number);
    if (!hookContext.request.query.number
        || typeof hookContext.request.query.number !== 'string'
        || isNaN(parseInt(hookContext.request.query.number, 10))) {
        hookContext.setResponse(
            400,
            { 'Content-Type': 'text/html' },
            'Bad Request');
    } else {
        hookContext.setResponse(200);
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
    hookContext.setResponse(
        200,
        { 'Content-Type': 'application/json' },
        content);
    done();
});

httpHooks.getResponder(urlPattern, function (hookContext, done) {
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
    hookContext.setResponse(
        200,
        { 'Content-Type': 'application/json' },
        content);
    done();
});

var server = http.createServer(function (request, response) {
    httpHooks.dispatch({request: request, response: response});
});

server.listen(8080);
```
