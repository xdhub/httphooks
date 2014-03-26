//
// Copyright (c) Microsoft Corporation. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// THIS CODE IS PROVIDED ON AN  *AS IS* BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT
// LIMITATION ANY IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR
// A PARTICULAR PURPOSE, MERCHANTABILITY OR NON-INFRINGEMENT.
//
// See the Apache Version 2.0 License for specific language governing
// permissions and limitations under the License.
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
