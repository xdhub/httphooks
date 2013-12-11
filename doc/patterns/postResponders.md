# Common uses of post-responder hooks
**Author:** Elmar Langholz

## Response validation using a post-responder hook

This example validates the HTTP response using a post-resonder hook. If the post-responder hook determines that the response is valid (which is found in the `HookContext.response.responses` array), it returns a success status code (2xx); otherwise, if invalid, it returns the error response. If an invalid response is returned the subsequent hooks in the execution chain are skipped and not executed.

```js
var http = require('http');
var httpHooks = new (require('httphooks'))();
var urlPattern = '/*';

httpHooks.getInResponder(urlPattern, function (hookContext, done) {
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

server.listen(8080);
```

## Response augmentation/replacement using a post-responder hook