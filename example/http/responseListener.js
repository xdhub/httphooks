var http = require('http');
var httpHooks = new (require('../../lib/httphooks.js'))();
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

server.listen(process.env.PORT);
console.log(process.env.IP + ':' + process.env.PORT);
