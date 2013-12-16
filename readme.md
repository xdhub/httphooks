# httphooks
**Author:** Elmar Langholz

`httphooks` is a [node](http://nodejs.org) HTTP pub-sub architecture that allows you to associate an incoming HTTP request to a single/multiple dependent/independent user defined operations. These operations work in a loosely coupled manner such that together, with a well defined [execution model](./doc/design.md), each collaborate in order to deliver a result. `httphooks` extends the webhooks model to the primary REST HTTP verbs and formalizes request/response, inter-communication and signaling using HTTP as the communication standard.

While there are existing and similar modules (a.k.a middleware), we have a pretty interesting architecture, model and set of features that are not present in others and which allow you to streamline your development. Don't be shy and take a look at our documentation, you just might be pleasantly surprised...

## Installation

```
npm install httphooks
```

## Usage

With `httphooks` you are able to associate logical units for execution with url paths with a given HTTP verb.

```js
var http = require('http');
var httpHooks = new (require('httphooks'))();

// Respond to any incoming requests with a hello world message which includes the url path
httpHooks.get('/*', function (hookContext, done) {
    var request = hookContext.request;
    var response = hookContext.response;
    response.statusCode = 200;
    response.headers = { 'Content-Type': 'text/html' };
    response.content = 'Welcome to \'' + request.url.path + '\'... Hello World! :)';
    done();
});

var server = http.createServer(function (request, response) {
    httpHooks.dispatch({request: request, response: response});
});

server.listen(8080);
```

## Features

* Integrates and standardizes on default primitives defined by the node.js http server.
* By default, supports the four main HTTP verbs: GET, PUT, POST and DELETE.
* Leverages [route-pattern](https://github.com/bjoerge/route-pattern) to define the resource locations to hook on.
* Well defined execution and inter-communication model for logical units.
* Clean separation between listener and responder for compute or I/O logical units.
* Inline or file path definition of logical units.
* Handling of non-matching requests to hooks.
* Supports detection and collapsing of multiple responses into a single multipart response.
* Large amount of documentation including design, common use patterns, code examples and API references.
* Large test suite exercising features.

## Documentation
* [General design](./doc/design.md)
* [Common hook usage patterns](./doc/patterns.md)
* [API reference](./doc/api.md)

## TODO
* Add runtime hook management through HTTP /httphooks topic.
* Add remote hook support as well as proxying.
* Add support for other HTTP verbs such as: HEAD and PATCH.
* Add support for automated parsing based on Content-Type.
* Add sandbox for function callbacks (http://gf3.github.io/sandbox/).
