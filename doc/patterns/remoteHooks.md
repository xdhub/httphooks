# Common uses of remote hooks
**Author:** Elmar Langholz

## Request forwarding and remote response

Given the distributed nature of the web we have provided the possibility of being able to forward/proxy an incoming request to a remote resource. This allows us to automatically either signal or allow a remote resource to contribute to the request's response. If the forward request is done through a responder then the expectation is that it will provide to the response chain; otherwise, it will serve the purpose of signaling for listeners. In the below code snippet, we can see that we have created to http server each one with its corresponding hook instance. The first server binds to port 8080 and creates a hook that forwards/proxies the request to a remote resource which is defined by the second server which binds to port 8081. After the request is forwarded to the second server, a request-listener hook logs to console the request and the remote responder hook responds with success. This response is then returned by the first server back to the client.

```js
var http = require('http');
var httpHooks1 = new (require('httphooks'))();
httpHooks1.getResponder('/local/hook', { uri: 'http://localhost:8081/remote/hook' });
var server1 = http.createServer(function (request, response) {
    httpHooks1.dispatch({request: request, response: response});
});

server1.listen(8080);

var httpHooks2 = new (require('httphooks'))();
httpHooks2.getRequestListener('/remote/hook', function (hookContext, done) {
    console.log('Incoming request to ' + hookContext.request.url.path);
    console.log('Method: ' + JSON.stringify(hookContext.request.method));
    console.log('Headers: ' + JSON.stringify(hookContext.request.headers));
    console.log('Content: ' + JSON.stringify(hookContext.request.content));
    done();
});
httpHooks2.getResponder('/remote/hook', function (hookContext, done) {
    hookContext.setResponse(
        200,
        { 'Content-Type': 'text/html' },
        'Hello from \'' + hookContext.request.url.path + '\'! :)');
    done();
});
var server2 = http.createServer(function (request, response) {
    httpHooks2.dispatch({request: request, response: response});
});

server2.listen(8081);
```
