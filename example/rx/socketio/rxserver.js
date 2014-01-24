var rxsocketio = require('./rxsocketio');
var serverObservable = rxsocketio.createServer(parseInt(process.env.PORT));
console.log(process.env.IP + ':' + process.env.PORT);

var connectionSubscription = serverObservable.subscribe(
    function (x) {
        console.log('Next: ' + x);
        x.on('request', function (request, functor) {
            console.log('request: ' + JSON.stringify(request));
            functor({ statusCode: 200, headers: { 'Content-Type': 'application/json' }, content: {}});
        });
    },
    function (err) {
        console.log('Error: ' + err);
    },
    function () {
        console.log('Completed');
    });
