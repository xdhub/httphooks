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

var Rx = require('rx');
var http = require('http');
for(var k in http) {
    exports[k] = http[k];
}

exports.createServer = function () {
    var subject = new Rx.Subject();
    var requestHandler = function (request, response) {
        subject.onNext({ request: request, response:  response });
    };
    var observable = subject.asObservable();
    var publishedObservable = observable.publish();
    publishedObservable.server = http.createServer(requestHandler);
    return publishedObservable;
};
