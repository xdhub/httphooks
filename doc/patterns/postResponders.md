# Common uses of post-responder hooks
**Author:** Elmar Langholz

## Response validation using a post-responder hook

This example validates the HTTP response using a post-responder hook. If the post-responder hook determines that the response is valid (which is found in the `HookContext.response.responses` array), it returns a success status code (2xx); otherwise, if invalid, it returns the error response. If an invalid response is returned the subsequent hooks in the execution chain are skipped and not executed.

```js
var http = require('http');
var httpHooks = new (require('httphooks'))();
var urlPattern = '/*';

httpHooks.getResponder(urlPattern, function (hookContext, done) {
    var myObject = {
        name: hookContext.request.query.name
    };

    var content = JSON.stringify(myObject);
    hookContext.setResponse(
        200,
        { 'Content-Type': 'application/json' },
        content);
    done();
});

httpHooks.getPostResponder(urlPattern, function (hookContext, done) {
    hookContext.setResponse(200);
    if (hookContext.response.responses.length === 1) {
        // We expect that the request url have an object with a property 'name'
        // and a corresponding string value
        var response = hookContext.response.responses[0];
        var myObject = JSON.parse(response.content);

        if (!myObject
            || !myObject.name
            || typeof myObject.name !== 'string') {
            hookContext.setResponse(
                500,
                { 'Content-Type': 'text/html' },
                'Internal Server Error');
        }
    }

    done();
});

var server = http.createServer(function (request, response) {
    httpHooks.dispatch({request: request, response: response});
});

server.listen(8080);
```

## Response augmentation/replacement using a post-responder hook

This example shows how to augment or replace an outgoing response through a post-responder hook. If the outgoing response is valid, we proceed to augment the content or body of the outgoing response with a user JSON object as a string to include the date when it was updated. Once the following hook is invoked we can see that the request is fully updated with the last response content.

```js
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
        } else {
            myObject.dateTime = new Date();
            var content = JSON.stringify(myObject);
            hookContext.replaceResponse(
                200,
                { 'Content-Type': 'application/json' },
                content);
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
```
