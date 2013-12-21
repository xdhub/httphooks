var http = require('http');
var httpHooks1 = new (require('../../../lib/httphooks.js'))();

httpHooks1.getResponder('/local/hook', { uri: 'http://localhost:8081/remote/hook' });

var server1 = http.createServer(function (request, response) {
    httpHooks1.dispatch({request: request, response: response});
});

server1.listen(8080);
