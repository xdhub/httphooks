var sockjsclient = require('sockjs-client');
var client = sockjsclient.create('http://127.0.0.1:' + process.env.PORT + '/');
client.on('connection', function () {
    console.log('client: connection');
});
client.on('data', function (message) {
    console.log('client: data');
    console.log('Message: ' + message);
    client.close();
});
client.on('close', function() {
    console.log('client: close');
});
client.on('error', function (error) {
    console.log('client: error');
    console.log('Error: ' + error);
});
//client.write('Have some text you mighty SockJS server!');
client.write(JSON.stringify({message: 'Have some text you mighty SockJS server!'}));
