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
    statusCode: -1,
    headersSent: false,
    sendDate: true
};

var ServerResponse = function (options) {
    options = options || defaultOptions;
    for (var propertyName in options) {
        this[propertyName] = options[propertyName];
    }

    for (var propertyName in defaultOptions) {
        if (!this[propertyName]) {
            this[propertyName] = defaultOptions[propertyName];
        }
    }

    this._endCalled = false;
    this._data = [];
    this._headers = {};
    this._encoding = 'utf8';
    this._reasonPhrase = '';
};

util.inherits(ServerResponse, EventEmitter);

ServerResponse.prototype.getHeader = function (name) {
    return this._headers[name];
};

ServerResponse.prototype.setHeader = function (name, value) {
    this._headers[name] = value;
};

ServerResponse.prototype.removeHeader = function (name) {
    delete this._headers[name];
};

ServerResponse.prototype.writeHead = function (statusCode, reasonPhrase, headers) {
    if (this._endCalled) {
        throw new Error('Unable to write after end');
    }

    this.statusCode = statusCode;
    if (headers) {
        this._reasonPhrase = reasonPhrase;
        this._headers = headers;
    } else {
        this._headers = reasonPhrase;
    }
};

ServerResponse.prototype.write = function (chunk, encoding) {
    this._data.push(chunk);
    if (encoding) {
        this._encoding = encoding;
    }
};

ServerResponse.prototype.end = function (data, encoding) {
    this._endCalled = true;
    if (data) {
        this._data.push(data);
    }

    if (encoding) {
        this._encoding = encoding;
    }

    this.emit('end');
};

module.exports = ServerResponse;
