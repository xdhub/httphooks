var http = require('http');
var httpHooks1 = new (require('../../../lib/httphooks.js'))();

var localHookPath = '/local/hook';
var localHook = {
    method: 'get',
    urlPattern: localHookPath,
    type: 'responder',
    callback: { uri: 'http://localhost:8081/remote/hook' }
};
httpHooks1.addHook(localHook);

var server1 = http.createServer(function (request, response) {
    httpHooks1.dispatch({request: request, response: response});
});

server1.listen(8080);
