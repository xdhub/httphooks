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

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var defaultOptions = { 
    method: 'GET',
    url: '/',
    query: {},
    headers: {},
    params: {},
    cookies: {},
    session: {},
    content: {},
    body: {},
    files: {}
};

var IncomingMessage = function (options) {
    options = options || defaultOptions;
    for (var propertyName in options) {
        this[propertyName] = options[propertyName];
    }

    for (var propertyName in defaultOptions) {
        if (!this[propertyName]) {
            this[propertyName] = defaultOptions[propertyName];
        }
    }
};

util.inherits(IncomingMessage, EventEmitter);
module.exports = IncomingMessage;
