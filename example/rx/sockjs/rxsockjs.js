var sockjs = require('sockjs');
var Rx = require('rx');

exports.createServer = function () {
    var server = sockjs.createServer({ sockjs_url: 'http://cdn.sockjs.org/sockjs-0.3.min.js' });
    var observable = Rx.Observable.fromEvent(server, 'connection');
    observable.server = server;
    return observable;
};
