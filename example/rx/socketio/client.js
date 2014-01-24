var io = require('socket.io-client');
var socket = io.connect('http://127.0.0.1:8082');
socket.on('connect', function () {
    console.log('Client connected!');
    socket.emit(
        'request',
        {
            method: 'GET',
            url: '/hook',
            headers: {
                'Content-Type': 'application/json'
            },
            content: {
                message: 'Hello World'
            }
        },
        function (response) {
            console.log('response: ' + JSON.stringify(response));
        });
})

