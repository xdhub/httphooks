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
var httpHooks1 = new (require('../../../lib/httphooks.js'))();

httpHooks1.getResponder('/local/hook', { uri: 'http://localhost:8081/remote/hook' });

var server1 = http.createServer(function (request, response) {
    httpHooks1.dispatch({request: request, response: response});
});

server1.listen(8080);
