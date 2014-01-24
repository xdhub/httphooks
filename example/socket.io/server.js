var io = require('socket.io').listen(parseInt(process.env.PORT));
var httpHooks = new (require('../../lib/httphooks.js'))();
httpHooks.getResponder('/hook', function (hookContext, done) {
    console.log('Request: ' + JSON.stringify(hookContext.request));
    hookContext.setResponse(
        200,
        { 'Content-Type': 'text/html' },
        'Welcome to socket.io... Hello World! :)');
    done();
});

io.on('connection', function (socket) {
    httpHooks.dispatch({webSocket: socket});
});

console.log(process.env.IP + ':' + process.env.PORT);
