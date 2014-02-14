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

httpHooks.getPreResponder(urlPattern, function (hookContext, done) {
    if (!hookContext.request.query.number
        || typeof hookContext.request.query.number !== 'string'
        || isNaN(parseInt(hookContext.request.query.number, 10))) {
        hookContext.setResponse(
            400,
            { 'Content-Type': 'text/html' },
            'Bad Request');
    } else {
        hookContext.setResponse(200);
    }

    done();
});

httpHooks.getResponder(urlPattern, function (hookContext, done) {
    var odd = {
        type: 'odd',
        numbers: []
    };

    var maxNumber = parseInt(hookContext.request.query.number, 10);
    for (var number = 1; number <= maxNumber; number++) {
        if ((number % 2) !== 0) {
            odd.numbers.push(number);
        }
    }

    var content = JSON.stringify(odd);
    hookContext.setResponse(200, { 'Content-Type': 'application/json' }, content);
    done();
});

httpHooks.getResponder(urlPattern, function (hookContext, done) {
    var even = {
        type: 'even',
        numbers: []
    };

    var maxNumber = parseInt(hookContext.request.query.number, 10);
    for (var number = 1; number <= maxNumber; number++) {
        if ((number % 2) === 0) {
            even.numbers.push(number);
        }
    }

    var content = JSON.stringify(even);
    hookContext.setResponse(200, { 'Content-Type': 'application/json' }, content);
    done();
});

var server = http.createServer(function (request, response) {
    httpHooks.dispatch({request: request, response: response});
});

server.listen(process.env.PORT);
var url = 'http://' + process.env.IP + ':' + process.env.PORT;
console.log(url);
