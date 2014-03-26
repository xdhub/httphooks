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

var util = require('util');
var clone = require('clone');
var initialization = require('./common/initialization.js');
var EventEmitter = require('events').EventEmitter;

var IncomingMessage = function (opts) {
    var defaultProperties = {
        httpVersion: null,
        method: null,
        url: '',
        query: {},
        headers: {},
        content: ''
    };
    var properties = opts && opts.properties ? clone(opts.properties) : defaultProperties;
    initialization.initializeGetterProperties(this, defaultProperties, properties);
};

util.inherits(IncomingMessage, EventEmitter);
module.exports = IncomingMessage;
