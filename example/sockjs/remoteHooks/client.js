var sockjsclient = require('sockjs-client');
var client = sockjsclient.create('http://127.0.0.1:8080/');
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
client.on('connection', function () {
    console.log('client: connection');
    client.write(JSON.stringify(request));
});
client.on('data', function (response) {
    console.log('client: data');
    console.log('Response: ' + response);
    client.close();
});
client.on('close', function() {
    console.log('client: close');
});
client.on('error', function (error) {
    console.log('client: error');
    console.log('Error: ' + error);
});
