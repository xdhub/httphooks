var http = require('http');
var httpHooks = new (require('../../lib/httphooks.js'))();

var server = http.createServer(function (request, response) {
    httpHooks.dispatch({request: request, response: response});
});

server.listen(process.env.PORT);
console.log(process.env.IP + ':' + process.env.PORT);
