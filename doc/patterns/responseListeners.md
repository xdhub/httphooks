# Common uses of response listener hooks
**Author:** Elmar Langholz

## Raw output response signaling

Response listener hooks are commonly used to signal and/or process in the background (without contributing to the response) of the raw response. This means that for the associated url path we can be sure that for the request we have access to the raw response after post-processing. In the code snippet below, we count the number of responses issued so that when we reached a threshold we log that we have reached the maximum, clear the count and start counting again.

```js
var http = require('http');
var httpHooks = new (require('httphooks'))();
var rawRequestsCount = 0;
httpHooks.getResponseListener('/my/test/hook', function (hookContext, done) {
    // Does not block the main execution chain for response
    rawRequestsCount++;
    if (rawRequestsCount >= 3) {
        var logMessage = 'We have reached ' + rawRequestsCount + ' requests\r\n';
        logMessage += 'Response: ' + JSON.stringify(hookContext.response);
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
