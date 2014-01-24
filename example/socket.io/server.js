var io = require('socket.io').listen(parseInt(process.env.PORT));
var httpHooks = new (require('../../lib/httphooks.js'))();

httpHooks.getResponder('/*', function (hookContext, done) {
    var content = 'Welcome to \'' + hookContext.request.url.path + '\'... Hello world! :)';
    hookContext.setResponse(200, { 'Content-Type': 'text/html' }, content);
    done();
});

io.on('connection', function (socket) {
    httpHooks.dispatch({webSocket: socket});
});

console.log(process.env.IP + ':' + process.env.PORT);
