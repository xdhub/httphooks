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

var http = require('http');
var httpHooks = new (require('../../lib/httphooks.js'))();
var urlPattern = '/*';

httpHooks.getResponder(urlPattern, function (hookContext, done) {
    var myObject = {
        name: hookContext.request.query.name
    };

    var content = JSON.stringify(myObject);
    hookContext.setResponse(200, { 'Content-Type': 'application/json' }, content);
    done();
});

httpHooks.getPostResponder(urlPattern, function (hookContext, done) {
    hookContext.setResponse(200);
    if (hookContext.responseQueue.length === 1) {
        // We expect that the request url have an object with a property 'name'
        // and a corresponding string value
        var response = hookContext.responseQueue[0];
        var myObject = JSON.parse(response.content);

        if (!myObject
            || !myObject.name
            || typeof myObject.name !== 'string') {
            hookContext.setResponse(500, { 'Content-Type': 'text/html' }, 'Internal Server Error');
        } else {
            myObject.dateTime = new Date();
            var content = JSON.stringify(myObject);
            hookContext.replaceResponse(
                200,
                { 'Content-Type': 'application/json' },
                content);
        }
    }

    done();
});

var server = http.createServer(function (request, response) {
    httpHooks.dispatch({request: request, response: response});
});

server.listen(process.env.PORT);
var url = 'http://' + process.env.IP + ':' + process.env.PORT;
console.log(url);
