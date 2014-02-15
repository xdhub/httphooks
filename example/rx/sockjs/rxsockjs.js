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

var sockjs = require('sockjs');
var Rx = require('rx');

exports.createServer = function () {
    var server = sockjs.createServer({ sockjs_url: 'http://cdn.sockjs.org/sockjs-0.3.min.js' });
    var observable = Rx.Observable.fromEvent(server, 'connection');
    observable = observable.map(function (connection) {
        return { socket: connection, framework: 'sockjs' };
    });
    observable.server = server;
    return observable;
};
