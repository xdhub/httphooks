# Common uses of request listener hooks
**Author:** Elmar Langholz

## Raw input request signaling

Request listener hooks are commonly used to signal and/or process in the background (without contributing to the response) of the raw request. This means that for the associated url path we can be sure that for the request there has been no request pre-processing (augmentation/validation). In the code snippet below, we count the number of request issued so that when we reached a threshold we log that we have reached the maximum, clear the count and start counting again.

```js
var http = require('http');
var httpHooks = new (require('httphooks'))();
var rawRequestsCount = 0;
httpHooks.getRequestListener('/my/test/hook', function (hookContext, done) {
    // Does not block the main execution chain for response
    rawRequestsCount++;
    if (rawRequestsCount >= 3) {
        var logMessage = 'We have reached ' + rawRequestsCount + ' requests';
        setTimeout(function () {
            console.log(logMessage);
            done();
        }, 5000);
        rawRequestsCount = 0;
    } else {
        done();
    }
});

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
