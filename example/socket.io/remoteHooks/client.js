var socket = require('socket.io-client').connect('http://' + process.env.IP + ':' + process.env.PORT);
var request = {
    method: 'GET',
    url: '/local/hook',
    headers: {
        'Content-Type': 'application/json'
    },
    content: JSON.stringify({
        message: 'Hello World'
    })
};
socket.on('connect', function () {
    console.log('connect');
    socket.emit(
        'request',
        request,
        function (response) {
            console.log('Response: ' + JSON.stringify(response));
            socket.disconnect();
        });
});
socket.on('disconnect', function () {
    console.log('disconnect');
});
socket.on('error', function (error) {
    console.log('error');
});
