# Common uses of post-listener hooks
**Author:** Elmar Langholz

## Post-processed response signaling (without augmentation/validation)

Post-listener hooks are commonly used to signal and/or process in the background (without contributing to the response) the previously validated/augmented request. This means that for the associated url path we can be sure that we will have the actual augmented/validated request before post-processing.

```js
var http = require('http');
var httpHooks = new (require('httphooks'))();
var rawRequestsCount = 0;
httpHooks.getPostListener('/my/test/hook', function (hookContext, done) {
    // Does not block the main execution chain for response
    rawRequestsCount++;
    if (rawRequestsCount >= 3) {
        var logMessage = 'We have reached ' + rawRequestsCount + ' requests\r\n';
        logMessage += 'Response queue: ' + JSON.stringify(hookContext.responseQueue);
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
