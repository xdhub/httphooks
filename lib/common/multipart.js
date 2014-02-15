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

var uuid = require('node-uuid');
var clone = require('clone');
var headerutils = require('./headerutils.js');
var crlfString = '\r\n';
var crlf = new Buffer(crlfString);
var contentTypeHeaderNameString = 'Content-Type';
var contentLengthHeaderNameString = 'Content-Length';
var multipartContentTypeHeaderString = 'multipart/';
var boundaryContentTypeHeaderString = 'boundary=';
var alphaValues = [
    'a', 'b', 'c', 'd', 'e',
    'f', 'g', 'h', 'i', 'j',
    'k', 'l', 'm', 'n', 'o',
    'p', 'q', 'r', 's', 't',
    'u', 'v', 'w', 'x', 'y',
    'z', 'A', 'B', 'C', 'D',
    'E', 'F', 'G', 'H', 'I',
    'J', 'K', 'L', 'M', 'N',
    'O', 'P', 'Q', 'R', 'S',
    'T', 'U', 'V', 'W', 'X',
    'Y', 'Z'
];
var digitValues = [
    '0', '1', '2', '3', '4',
    '5', '6', '7', '8', '9'
];
var extraBoundaryValues = [
    '\'', '(', ')', '+', '_',
    ',', '-', '.', '/', ':',
    '=', '?', ' '
];

// http://tools.ietf.org/html/rfc2046#section-5.1.3
// http://www.w3.org/Protocols/rfc1341/7_2_Multipart.html
var validBoundaryCharacterValues = [].concat(
    digitValues,
    alphaValues,
    extraBoundaryValues
);

var validSubtypeCharacterValues = [].concat(
    digitValues,
    alphaValues,
    ['-']
);

function isValidBoundaryValueCharacter(value) {
    return validBoundaryCharacterValues.indexOf(value) !== -1;
}

function validateBoundaryValue(value) {
    if (typeof value !== 'string') {
        throw new TypeError('Invalid boundary value type, expected \'string\'');
    }

    if (value.length < 1 || value.length > 70) {
        throw new Error(
            'Invalid number of characters for the boundary value: ' +
            'Expected 1 to 70 characters and detected ' + value.length);
    }

    if (value.lastIndexOf(' ') === (value.length - 1)) {
        throw new Error('Invalid boundary value: should not end with space');
    }

    for (var index = 0; index < value.length; index++) {
        var character = value[index];
        if (!isValidBoundaryValueCharacter(character)) {
            throw new Error(
                'Invalid character \'' + character + '\' found at index ' +
                index + ' in boundary value');
        }
    }
}

function validatePart(part) {
    if (typeof part !== 'string' && !(part instanceof Buffer)) {
        throw new Error(
            'Invalid parts item: expected items to be of type \'string\'' +
            ' or \'Buffer\'');
    }
}

function validateParts(parts) {
    if (!(parts instanceof Array)) {
        throw new TypeError('Invalid parts: expected to be an array');
    }

    for (var index = 0; index < parts.length; index++) {
        var part = parts[index];
        validatePart(part);
    }
}

function isValidSubtypeCharacter(character) {
    return validSubtypeCharacterValues.indexOf(character) !== -1;
}

function validateSubtype(subtype) {
    if (typeof subtype !== 'string') {
        throw new TypeError('Invalid subtype type, expected \'string\'');
    }

    if (subtype.length === 0) {
        throw new Error('No subtype value provided');
    }

    for (var index = 0; index < subtype.length; index++) {
        var character = subtype[index];
        if (!isValidSubtypeCharacter(character)) {
            throw new Error('Encountered invalid character in subtype: ' + character);
        }
    }
}

function validatePreamble(preamble) {
    if (preamble && typeof preamble !== 'string') {
        throw new TypeError('Invalid preamble type, expected \'string\'');
    }
}

function validateEpilogue(epilogue) {
    if (epilogue && typeof epilogue !== 'string') {
        throw new TypeError('Invalid epilogue type, expected \'string\'');
    }
}

function validateHeaders(headers, confirmHeadersExist) {
    if (typeof headers !== 'object') {
        throw new TypeError('Invalid headers type, expected \'object\'');
    }

    if (confirmHeadersExist) {
        validateHeaderExists(headers, 'Content-Type');
        validateHeaderExists(headers, 'Content-Length');
    }
}

function validateContent(content) {
    if (typeof content !== 'string') {
        throw new Error('Invalid content type, expected items to be of type \'string\'');
    }
}

var Multipart = function (opts) {
    var defaultOptions = {
        boundaryValue: uuid.v4(),
        subtype: 'mixed',
        headers: { },
        preamble: '',
        parts: [],
        epilogue: ''
    };
    var options = opts ? clone(opts) : defaultOptions;
    for (var propertyName in defaultOptions) {
        options[propertyName] = !options[propertyName]
                                ? defaultOptions[propertyName]
                                : options[propertyName];
    }

    validateBoundaryValue(options.boundaryValue);
    validateSubtype(options.subtype);
    validateHeaders(options.headers);
    validatePreamble(options.preamble);
    validateParts(options.parts);
    validateEpilogue(options.epilogue);

    if (options.parts.length > 0) {
        for (var index = 0; index < options.parts.length; index++) {
            var part = options.parts[index];
            this.push(part);
        }
    }

    this.getBoundaryValue = function () {
        return options.boundaryValue;
    };

    this.setBoundaryValue = function (boundary) {
        validateBoundaryValue(boundary);
        options.boundaryValue = boundary;
    };

    this.getSubtype = function () {
        return options.subtype;
    };

    this.setSubtype = function (subtype) {
        validateSubtype(subtype);
        options.subtype = subtype;
    };

    this.getHeader = function (name) {
        return options.headers[name];
    };

    this.setHeader = function (name, value) {
        options.headers[name] = value;
    };

    this.getHeaders = function() {
        return options.headers;
    };

    this.getPreamble = function () {
        return options.preamble;
    };

    this.setPreamble = function (value) {
        validatePreamble(value);
        options.preamble = value;
    };

    this.getEpilogue = function () {
        return options.epilogue;
    };

    this.setEpilogue = function (value) {
        validateEpilogue(value);
        options.epilogue = value;
    };
};

Multipart.prototype = new Array();
Multipart.constructor = Multipart;

function validateHeaderExists(headers, name) {
    var headerName = headerutils.getActualHeaderName(headers, name);
    if (!headerName) {
        throw new Error('Invalid header name \'' + name + '\': it does not exist!');
    }

    var value = headers[headerName];
    if (typeof value === 'undefined') {
        throw new Error('The value for header ' + name + ' does not exist');
    }
}

function setContentTypeHeader(value) {
    var contentTypeName = headerutils.getActualHeaderName(this.getHeaders(), contentTypeHeaderNameString) || contentTypeHeaderNameString;
    this.setHeader(contentTypeName, value);
}

function setContentLengthHeader(value) {
    var contentLengthName = headerutils.getActualHeaderName(this.getHeaders(), contentLengthHeaderNameString) || contentLengthHeaderNameString;
    this.setHeader(contentLengthName, value);
}

function normalizeParts() {
    var parts = [];
    for (var index = 0; index < this.length; index++) {
        var item = this[index];
        if (!(item instanceof Buffer)) {
            item = new Buffer(item.toString());
            validatePart(item);
        }

        parts.push(item);
    }

    return parts;
}

Multipart.prototype.compose = function () {
    var contentTypeValue =
        multipartContentTypeHeaderString + this.getSubtype() + '; ' +
        boundaryContentTypeHeaderString + this.getBoundaryValue();
    setContentTypeHeader.call(this, contentTypeValue);
    var boundary = Buffer.concat([
        crlf,
        new Buffer('--' + this.getBoundaryValue()),
        crlf]);
    var end = Buffer.concat([
        crlf,
        new Buffer('--' + this.getBoundaryValue() + '--'),
        crlf]);
    if (this.length === 0) {
        throw new Error('There must be at least one part defined to be able to compose');
    }

    var parts = normalizeParts.call(this);
    var multipartBufferArray = [];
    if (this.getPreamble()) {
        multipartBufferArray.push(new Buffer(this.getPreamble()));
    }

    for (var index = 0; index < parts.length; index++) {
        multipartBufferArray.push(boundary);
        var part = parts[index];
        multipartBufferArray.push(part);
    }

    multipartBufferArray.push(end);
    if (this.getEpilogue()) {
        multipartBufferArray.push(new Buffer(this.getEpilogue()));
    }

    var contentBuffer = Buffer.concat(multipartBufferArray);
    setContentLengthHeader.call(this, contentBuffer.length);
    var multipart = {
        headers: this.getHeaders(),
        content: contentBuffer
    };
    return multipart;
};

function getContentTypeHeaderSubtype(value) {
    var normalizedValue = value.toLowerCase();
    var startIndex= normalizedValue.indexOf(multipartContentTypeHeaderString);
    if (startIndex === -1) {
        throw new Error('The provided content-type header does not contain a multipart declaration');
    }

    var subtypeArray = [];
    var index = startIndex + multipartContentTypeHeaderString.length;
    while (index < value.length && isValidSubtypeCharacter(value[index])) {
        subtypeArray.push(value[index++]);
    }

    var subtype = subtypeArray.join('');
    return subtype;
}

function getContentTypeHeaderBoundary(value) {
    var normalizedValue = value.toLowerCase();
    var startIndex= normalizedValue.indexOf(boundaryContentTypeHeaderString);
    if (startIndex === -1) {
        throw new Error('The provided content-type header does not contain a boundary declaration');
    }

    var maxNumCharacters = 70;
    var boundaryValueArray = [];
    var index = startIndex + boundaryContentTypeHeaderString.length;
    while (index < value.length
        && isValidBoundaryValueCharacter(value[index])
        && boundaryValueArray.length < maxNumCharacters) {
        boundaryValueArray.push(value[index++]);
    }

    var boundaryValue = boundaryValueArray.join('').trimRight();
    return boundaryValue;
}

function parseContentTypeHeader(headers) {
    var contentTypeName = headerutils.getActualHeaderName(headers, contentTypeHeaderNameString);
    var contentTypeValue = headers[contentTypeName];
    var subtype = getContentTypeHeaderSubtype(contentTypeValue);
    validateSubtype(subtype);
    var boundaryValue = getContentTypeHeaderBoundary(contentTypeValue);
    validateBoundaryValue(boundaryValue);
    return {
        subtype: subtype,
        boundaryValue: boundaryValue,
        headers: headers
    };
}

function parseContent(options, content) {
    var boundary = crlfString + '--' + options.boundaryValue + crlfString;
    var end = crlfString + '--' + options.boundaryValue + '--' + crlfString;
    var endStartIndex = content.indexOf(end);
    if (endStartIndex === -1) {
        throw new Error('The content does not contain a closing boundary');
    }

    var boundaryIndexes = [];
    do
    {
        var boundaryIndex = content.indexOf(
            boundary,
            boundaryIndexes.length === 0
                ? 0
                : boundaryIndexes[boundaryIndexes.length - 1] + boundary.length);
        boundaryIndexes.push(boundaryIndex);
    }
    while (boundaryIndexes[boundaryIndexes.length - 1] !== -1
        && boundaryIndexes[boundaryIndexes.length - 1] < endStartIndex);
    if (boundaryIndexes[boundaryIndexes.length - 1] >= endStartIndex) {
        throw new Error('The content is malformed containing a boundary after the closing boundary');
    }

    boundaryIndexes.splice(boundaryIndexes.length - 1, 1);
    if (boundaryIndexes.length === 0) {
        throw new Error('The content does not contain any boundaries');
    }

    boundaryIndexes.push(endStartIndex);
    var parts = [];
    for (var index = 0; index < boundaryIndexes.length - 1; index++) {
        var part = content.substring(
            boundaryIndexes[index] + boundary.length,
            boundaryIndexes[index + 1]);
        parts.push(part);
    }

    options.parts = parts;
    var preamble = content.substring(0, boundaryIndexes[0]);
    options.preamble = preamble.length !== 0 && preamble !== crlfString
                        ? preamble
                        : null;

    var epilogue = content.substring(endStartIndex + end.length, content.length);
    options.epilogue = epilogue.length !== 0 && epilogue !== crlfString
                        ? epilogue
                        : null;
}

Multipart.parse = function (headers, content) {
    validateHeaders(headers, true);
    validateContent(content);
    var options = parseContentTypeHeader(headers);
    parseContent(options, content);
    return options;
};

module.exports = Multipart;
