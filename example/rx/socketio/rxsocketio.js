var Rx = require('rx');

exports.createServer = function (port) {
    var server = require('socket.io').listen(port);
    var observable = Rx.Observable.fromEvent(server.sockets, 'connection');
    observable = observable.map(function (socket) {
        return { socket: socket, framework: 'socket.io' };
    });
    observable.server = server;
    return observable;
};
