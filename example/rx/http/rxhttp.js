var Rx = require('rx');
var http = require('http');
for(var k in http) {
    exports[k] = http[k];
}

exports.createServer = function () {
    var subject = new Rx.Subject();
    var requestHandler = function (request, response) {
        subject.onNext({ request: request, response:  response });
    };
    var observable = subject.asObservable();
    var publishedObservable = observable.publish();
    publishedObservable.server = http.createServer(requestHandler);
    return publishedObservable;
};
