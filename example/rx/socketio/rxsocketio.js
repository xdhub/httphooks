var Rx = require('rx');

exports.createServer = function (port) {
    var server = require('socket.io').listen(port);
    var observable = Rx.Observable.fromEvent(server.sockets, 'connection');
    observable.server = server;
    return observable;
};
