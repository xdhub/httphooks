//
// Copyright (c) Microsoft and contributors.  All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

var sockjsclient = require('sockjs-client');
var client = sockjsclient.create('http://127.0.0.1:' + process.env.PORT + '/');
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
