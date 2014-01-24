var socket = require('socket.io-client').connect('http://' + process.env.IP + ':' + process.env.PORT);
var request = {
    method: 'GET',
    url: '/hook',
    headers: {
        'Content-Type': 'application/json'
    },
    content: JSON.stringify({
        message: 'Hello World'
    })
};
socket.on('connect', function () {
    socket.emit(
        'request',
        request,
        function (response) {
            console.log('Response: ' + JSON.stringify(response));
        });
});
