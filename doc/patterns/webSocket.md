# Common uses of web sockets
**Author:** Elmar Langholz

Similar to the default http server, we are able to interface with the sockjs and socket.io web socket frameworks and fully support all the same actions/verbs defined by the HTTP protocol. To make a long story short, we expect to have a well crafted [IncomingMessage](http://nodejs.org/api/http.html#http_http_incomingmessage) as the request and we create our custom internal representation of [ServerResponse](http://nodejs.org/api/http.html#http_class_http_serverresponse) allowing us to switch between the http and web socket frameworks internally. Note that we only rely on a subset of the properties defined in for `IncomingMessage`.

Since both sockjs and socket.io are web socket framework, whenever we establish a client connection to the server we don't pass the request/response pair to be dispatched, but instead we proceed to pass the socket or connection and using the framework property we identify what web socket framework we want to use to service any incoming request.

## Using sockjs

```js
var http = require('http');
var sockjs = require('sockjs');
var httpHooks = new (require('httphooks'))();

httpHooks.getResponder('/*', function (hookContext, done) {
    var content = 'Welcome to \'' + hookContext.request.url.path + '\'... Hello world! :)';
    hookContext.setResponse(200, { 'Content-Type': 'text/html' }, content);
    done();
});

var sockjsServer = sockjs.createServer({ sockjs_url: 'http://cdn.sockjs.org/sockjs-0.3.min.js' });
sockjsServer.on('connection', function (connection) {
    httpHooks.dispatch({ socket: connection, framework: 'sockjs' });
});

var httpServer = http.createServer(function (request, response) {
    console.log('httpServer: Request received!');
});

httpServer.on('upgrade', function (request, response) {
    console.log('httpServer: upgrade');
    response.end();
});

httpServer.listen(process.env.PORT);
sockjsServer.installHandlers(httpServer);
```

## Using socket.io

```js
var io = require('socket.io').listen(parseInt(process.env.PORT));
var httpHooks = new (require('../../lib/httphooks.js'))();

httpHooks.getResponder('/*', function (hookContext, done) {
    var content = 'Welcome to \'' + hookContext.request.url.path + '\'... Hello world! :)';
    hookContext.setResponse(200, { 'Content-Type': 'text/html' }, content);
    done();
});

io.on('connection', function (socket) {
    httpHooks.dispatch({socket: socket, framework: 'socket.io'});
});

console.log(process.env.IP + ':' + process.env.PORT);
```
