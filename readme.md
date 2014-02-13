# httphooks
**Author:** Elmar Langholz

In this world of internet of things, we have realized that while there are multiple frameworks, protocols and standards that allow you to intercommunicate between different devices none is more prevalent than the actual ones exposed by and defined through the web. For this reason, this module has the intent of standardizing using HTTP, REST and web sockets with the intent to facilitate connecting logic and data while maintaining its distribution and facilities.

`httphooks` is a [node](http://nodejs.org) HTTP pub-sub architecture that allows you to associate an incoming HTTP request to a single/multiple dependent/independent user defined operations. These operations work in a loosely coupled manner such that together, with a well defined [execution model](./doc/design.md), each collaborate in order to deliver a result. `httphooks` extends the webhooks model to the primary REST HTTP verbs and formalizes request/response, inter-communication and signaling using HTTP as the communication standard.

While there are existing and similar modules (a.k.a middleware), we have a pretty interesting architecture, model and set of features that are not present in others and which allow you to streamline your development. Don't be shy and take a look at our documentation, you just might be pleasantly surprised...

## Tests
##### Running the tests
The test suite can be invoked from the command line like this:  
> <code>npm test</code>  

##### Some details about the tests
In order to successfully run the tests three environment variables are used for setting the port numbers: <code>PORT</code>, <code>PORT1</code> and <code>PORT2</code>. 

* <code>PORT</code> and <code>PORT1</code> default to <code>8080</code>
* <code>PORT2</code> defaults to <code>8081</code>

For now, if you want to use different port numbers, you'll have to modify the values in the <code>./tests/runTests.js</code> file. When time permits we'll change this so it can be done in some other manner (i.e. via a JSON file, command-line options, etc.).


## Usage

With `httphooks` you are able to associate logical units for execution with url paths with a given HTTP verb.

```js
var http = require('http');
var HttpHooks = new require('httphooks');
var hooks = new HttpHooks();

// Respond to any incoming requests with a hello world message which includes the url path
hooks.get('/*', function (hookContext, done) {
    var request = hookContext.request;
    var response = hookContext.response;
    hookContext.setResponse(
        200,
        { 'Content-Type': 'text/html' },
        'Welcome to \'' + request.url.path + '\'... Hello World! :)');
    done();
});

var server = http.createServer(function (request, response) {
    hooks.dispatch({request: request, response: response});
});

server.listen(8080);
```

## Features
* Integrates and standardizes on default primitives defined by the HTTP protocol.
* Interfaces with node.js http server and both [sockjs](https://github.com/sockjs/) and  [socket.io](http://socket.io).
* By default, supports the four main HTTP verbs: GET, PUT, POST and DELETE.
* Leverages [route-pattern](https://github.com/bjoerge/route-pattern) to define the resource locations to hook on.
* Well defined execution and inter-communication model for logical units.
* Clean separation between listener and responder for compute or I/O logical units.
* Inline, file (e.g. 'file:') or remote (e.g. 'http:', 'https:' or 'ws:') hook definition of logical execution units.
* Default responder support allowing any request to be serviced when no matching hook is found.
* Handling of non-matching requests to hooks (when no default responder is set).
* Supports detection and collapsing of multiple responses into a single multipart response (by default).
* Large amount of documentation including design, common use patterns, code examples and API references.
* Large test suite exercising features.

## Documentation
* [General design](./doc/design.md)
* [Common hook usage patterns](./doc/patterns.md)
* [API reference](./doc/api.md)
* [Examples](./example)

## TODO
* Design and implement push mechanism example for devices using [Azure notification hub service](http://www.windowsazure.com/en-us/documentation/articles/notification-hubs-nodejs-how-to-use-notification-hubs/).
* Research, design and implement authentication using [JSON Web Token](http://tools.ietf.org/html/draft-ietf-oauth-json-web-token-14) ([node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)) or OAuth2.
* Design and implement Policy using [edge.js](https://github.com/tjanczuk/edge) as the communication bridge.
* Review [nodejx](http://nodejx.com/) and analyze integration possibilities (after 24th of January 2014, when it is released).
* Add runtime hook management through HTTP ~/httphooks topic.
* Add [sandbox.js](http://gf3.github.io/sandbox/) for function callbacks.
* Replace custom validation with [schema-inspector](http://atinux.github.io/schema-inspector/).
* Add support for automated parsing based on Content-Type.
* Add support for other HTTP verbs such as: HEAD and PATCH.
* Extract the WebSockets (sockjs, socket.io) as an optional add-on to make httphooks more lightweight
* Provide a means for easily setting the port numbers used by the unit tests. Something other than having to manually edit the values in <code>./tests/runTests.js</code>.
