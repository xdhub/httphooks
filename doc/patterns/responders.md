# Common uses of responder hooks
**Author:** Elmar Langholz

## Multi-responder using responder hooks

This example demonstrates how multiple responders can generate a single multipart response. If the incoming request is valid, we proceed to execute the responders. The first will calculate all the odd numbers from one to the provided number in the query. The second will calculate all the even numbers from 1 to the provided number in the query. `httphooks` will then detect that there are multiple responses for the incoming request and in turn generate a single multipart response for which we can use the `HookContext.parseMultiResponse` method to parse it.

```js
var http = require('http');
var httpHooks = new (require('httphooks'))();
var urlPattern = '/*';

httpHooks.getPreResponder(urlPattern, function (hookContext, done) {
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

httpHooks.getResponder(urlPattern, function (hookContext, done) {
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

## No hook match handler

Whenever there is no default responder hook set or an associated hook for a url path and want to be able to determine when we hit this condition in order to respond generically, we can leverage the `HttpHooksOptions.noMatchHandler` when constructing the `httphooks` instance or the `HttpHooks.noMatchHandler` setter after being constructed. By default, if no function is provided to handle the `HttpContext`, a Not Found (404) handler is used to respond as part of the request. In this code snippet, if we issue a request to `http://localhost:8080/my/test/hook` we will receive a success response as per the defined responder. However, we also proceed to overwrite the default no match handler to return an Internal Server Error response (instead of the default Not Found response) when we issue a request to a url path which for which there is no matching hook.

```js
var http = require('http');
var HttpHooks = require('httphooks');
var hookOptions = {
    noMatchHandler: function (httpContext) {
        httpContext.response.writeHead(500, { 'Content-Type': 'text/html' });
        httpContext.response.write('Internal Server Error');
        httpContext.response.end();
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

server.listen(8080);
```

## Default responder hook

This example shows that we can define a default responder through `HttpHooksOptions.defaultResponder`, to always be invoked while conserving the execution chain, when there are no responder hooks associated with the defined url path. This is useful when we are trying to abstract a storage facility or other resource that we want to use by default to service a request. *Please note that when a default responder is set the `HttpHooks.noMatchHandler` will never be invoked*. In this code snippet, if we a issue a request to `http://localhost:8080/my/test/hook` we will receive a success response, unlike if we issue a request to any other we will receive an Internal Server Error response as defined by the default responder.

```js
var http = require('http');
var HttpHooks = require('httphooks');
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

server.listen(8080);
```
