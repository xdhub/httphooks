# Common uses of pre-responder hooks
**Author:** Elmar Langholz

## Request validation using a pre-responder hook

This example validates the HTTP request using a pre-responder hook. If the pre-responder hook determines that the request is valid, it returns a success status code (2xx); otherwise, if invalid, it returns the error response. If an invalid response is returned the subsequent hooks in the execution chain are skipped and not executed.

```js
var http = require('http');
var httpHooks = new (require('httphooks'))();
var urlPattern = '/*';

httpHooks.getPreResponder(urlPattern, function (hookContext, done) {
    // We expect that the request url have a query string containing a
    // key named 'name' and a corresponding  string value. e.g. /?name=Elmar
    if (!hookContext.request.query.name
        || typeof hookContext.request.query.name !== 'string') {
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
    var content = 'Welcome to \'' + hookContext.request.url.path + '\'...'
        + '\r\nHello ' + hookContext.request.query.name + '! :)';
    hookContext.setResponse(
        200,
        { 'Content-Type': 'text/html' },
        content);
    done();
});

var server = http.createServer(function (request, response) {
    httpHooks.dispatch({request: request, response: response});
});

server.listen(8080);
```

## Request augmentation/replacement using a pre-responder hook

This example shows how to augment or replace an incoming request through a pre-responder hook. If the incoming request is valid, we proceed to augment the content or body of the incoming request with a user JSON object as a string. Once the following hook is invoked we can see that the request is fully updated with the previous request content.

```js
var http = require('http');
var httpHooks = new (require('httphooks'))();
var urlPattern = '/*';

httpHooks.getPreResponder(urlPattern, function (hookContext, done) {
    if (!hookContext.request.query.name
        || typeof hookContext.request.query.name !== 'string') {
        hookContext.setResponse(
            400,
            { 'Content-Type': 'text/html' },
            'Bad Request');
    } else {
        // Augment the content of the incoming request with a user object which
        // is converted to a JSON string
        var content = JSON.stringify({
            name: hookContext.request.query.name,
            normalizedName: hookContext.request.query.name.toLowerCase()
        });
        hookContext.replaceRequest(hookContext.request.headers, content);
    }

    done();
});

httpHooks.getInResponder(urlPattern, function (hookContext, done) {
    // Convert back the content to an object
    var user = JSON.parse(hookContext.request.content);
    var content = 'Welcome to \'' + hookContext.request.url.path + '\'...'
        + '\r\nHello ' + user.normalizedName + '! :)';
    hookContext.setResponse(
        200,
        { 'Content-Type': 'text/html' },
        content);
    done();
});

var server = http.createServer(function (request, response) {
    httpHooks.dispatch({request: request, response: response});
});

server.listen(8080);
```
