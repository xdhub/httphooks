/**
 * @title MultipartParse Reference
 * @author Elmar Langholz
 */

var Multipart = require('./multipart.js');
var headerutils = require('./headerutils.js');
var HookContextResponse = require('./../hookContextResponse.js');
var async = require('async');

/**
 * Creates an MultipartParse object
 * @class MultipartParse
 */
function parseHeaders(headersAsString, cb) {
    var crlf = '\r\n';
    var headerLines = headersAsString.split(crlf);
    async.map(
        headerLines,
        function (line, lineCb) {
            var colonIndex = line.indexOf(':');
            if (colonIndex !== -1) {
                var key = line.slice(0, colonIndex);
                if (line[colonIndex + 1] === ' ') {
                    var value = line.slice(colonIndex + 2);
                    lineCb(null, { key: key, value: value });
                } else {
                    lineCb(new Error('Expected to be a space after the colon but none was found for the header line: \'' + line + '\''));
                }
            } else {
                lineCb(new Error('Expected colon within the header line: \'' + line + '\''));
            }
        },
        function (error, parsedHeaders) {
            if (error) {
                cb(error);
            } else {
                async.reduce(parsedHeaders, {}, function (headers, header, reduceCb) {
                    headers[header.key] = header.value;
                    reduceCb(null, headers);
                },
                cb);
            }
        });
}

function executeHttpParser(headers, part, cb) {
    var HTTPParser = process.binding('http_parser').HTTPParser;
    var parser = new HTTPParser(HTTPParser.RESPONSE);
    parser.onHeadersComplete = function (info) {
        var infoHeaders = {};
        for (var index = 0; index < info.headers.length - 1; index += 2) {
            var key = info.headers[index];
            var value = info.headers[index + 1];
            infoHeaders[key] = value;
        }

        info.headers = headerutils.mergeHeaders(headers, infoHeaders);
        parser.info = info;
    };
    parser.onBody = function (buffer, start, length) {
        parser.content = buffer.slice(start, start + length).toString();
    };
    var parseResult = parser.execute(part, 0, part.length);
    if (parseResult instanceof Error) {
        cb(parseResult);
    } else {
        var response = HookContextResponse.createResponse(
            parser.info.statusCode,
            parser.info.headers,
            parser.content);
        cb(null, response);
    }
}

function parsePart(part, cb) {
    var crlf = '\r\n';
    var headersSeparator = crlf + crlf;
    var bodyStartIndex = part.indexOf(headersSeparator);
    if (bodyStartIndex !== -1) {
        var headersAsString = part.slice(0, bodyStartIndex);
        parseHeaders(headersAsString, function (error, headers) {
            var partBody = part.slice(bodyStartIndex + headersSeparator.length);
            var partBodyBuffer = new Buffer(partBody);
            executeHttpParser(headers, partBodyBuffer, cb);
        });
    } else {
        cb(new Error('Content multi-part does not have a valid header separator: \'' + part + '\''));
    }
}

/**
 * Parses a an HTTP response containing a multiple responses through multipart.
 * @method parse
 * @param {object} headers The headers of the response.
 * @param {string} content The content or body to parse.
 * @param {function} cb The node callback to invoke whenever the parsing succeeded or failed.
 */
var parse = function (headers, content, cb) {
    if (typeof cb !== 'function') {
        throw new TypeError('Invalid callback function provided');
    }

    var multipart = null;
    try {
        multipart = Multipart.parse(headers, content);
    } catch (error) {
        cb(error);
    }

    if (multipart !== null) {
        async.map(
            multipart.parts,
            parsePart,
            function (error, parts) {
                if (error) {
                    cb(error);
                } else {
                    multipart.parts = parts;
                    cb(null, multipart);
                }
            });
    }
};

module.exports = {
    parse: parse
};
