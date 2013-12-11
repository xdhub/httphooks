/**
 * @title HookContext Reference
 * @author Elmar Langholz
 */
 
var querystring = require('querystring');
var url = require('url');
var Multipart = require('./multipart.js');
var headerutils = require('./headerutils.js');
var async = require('async');
var clone = require('clone');

/**
 * Create an Request object
 * @class Request
 * @member {string} method The HTTP method of the request.
 * @member {Url} url The [url](http://nodejs.org/docs/latest/api/url.html) of the request.
 * @member {object} query The parsed query string as an object.
 * @member {object} headers The parsed headers as an object.
 * @member {string} content The request content or body.
 */
/**
 * Converts the provided content or body to a JSON object.
 * @method json
 * @returns {object} The JSON object representing the content.
 */
function createRequest(request) {
    var uri = url.parse(request.url);
    var query = querystring.parse(uri.query);
    return {
        method: clone(request.method),
        url: clone(uri),
        query: clone(query),
        headers: clone(request.headers),
        content: clone(request.content),
        json: function () {
            return JSON.parse(this.content);
        }
    };
}

/**
 * Create an Response object
 * @class Response
 * @member {number} statusCode The HTTP status code for the response.
 * @member {object} headers The response headers as an object.
 * @member {string} content The response content or body.
 * @member {Response[]} response The previously added responses by other hooks.
 */
/**
 * Determines whether or not the provided status code is successful.
 * @method isSuccess
 * @returns {boolean} True if the status code is successful; otherwise, false.
 */
var createResponse = function (statusCode, headers, content) {
    return {
        statusCode: statusCode || -1,
        headers: headers || {},
        content: content || '',
        isSuccess: function () {
            return isSuccessfulStatusCode(this.statusCode);
        }
    };
};

/**
 * Create an HookInformation object
 * @class HookInformation
 * @member {string} identifier The hook's unique identifier.
 * @member {string} urlPattern The url pattern (in the form [route-pattern](https://github.com/bjoerge/route-pattern)) corresponding to the hook.
 * @member {string} order The lower-cased hook order corresponding to the hook: `'pre' | 'in' | 'post'`
 * @member {string} type The lower-cased hook type corresponding to the hook: `'listener' | 'responder'`
 */
var createHookInformation = function (hook) {
    return {
        identifier: clone(hook.identifier),
        urlPattern: clone(hook.urlPatternString),
        order: clone(hook.order),
        type: clone(hook.type)
    };
};

/**
 * Create an HookContext object
 * @class HookContext
 * @member {Request} request The request object.
 * @member {Response} response The response object.
 * @member {HookInformation} hook The current hook's information.
 */
/**
 * If the hook is a pre-responder hook, it replaces the incoming request with
 * the provided argument; otherwise, the function is not provided.
 * @method replaceRequest
 * @param {object} headers The headers to replace the incoming request with.
 * @param {string} content The content to replace the incoming request with.
 */
/**
 * If the hook is a post-responder hook, it replaces the outgoing response with
 * the provided parameters; otherwise, the function is not provided.
 * @method replaceResponse
 * @param {number} statusCode The status code to replace the outgoing response with.
 * @param {object} headers The headers to replace the outgoing response with.
 * @param {string} content The content to replace the outgoing response with.
 */
var HookContext = function (httpContext, hook) {
    validateHttpContext(httpContext);
    this.request = createRequest(httpContext.request);
    this.response = createResponse();
    this.response.responses = clone(httpContext.response.responses);
    this.hook = createHookInformation(hook);
    this.parseMultiResponse = parseMultiResponse;

    if (hook.order === 'pre' && hook.type === 'responder') {
        this.replaceRequest = function (headers, content) {
            this.response.statusCode = 100;
            this.response.content = continueContent(100, headers, content);
        };
    }

    if (hook.order === 'post' && hook.type === 'responder') {
        this.replaceResponse = function (statusCode, headers, content) {
            this.response.statusCode = 100;
            this.response.content = continueContent(statusCode, headers, content);
        };
    }
};

function validateHttpContextRequest(request) {
    if (typeof request !== 'object' || request === null) {
        throw new TypeError('The provided httpContext request is invalid');
    }

    if (typeof request.url !== 'string') {
        throw new TypeError('The provided httpContext request url is invalid');
    }

    if (typeof request.method !== 'string') {
        throw new TypeError('The provided httpContext request method is invalid');
    }

    if (typeof request.headers !== 'object' || request.headers === null) {
        throw new TypeError('The provided httpContext request headers are invalid');
    }

    if (typeof request.content !== 'string') {
        throw new TypeError('The provided httpContext request content is invalid');
    }
}

function validateHttpContextResponseResponses(responses) {
    if (!(responses instanceof Array)) {
        throw new TypeError('The provided httpContext response responses are invalid');
    }
}

function validateHttpContext(httpContext) {
    if (typeof httpContext !== 'object' || httpContext === null) {
        throw new Error('The provided httpContext is invalid');
    }

    validateHttpContextRequest(httpContext.request);

    if (typeof httpContext.response !== 'object' || httpContext.response === null) {
        throw new Error('The provided httpContext response is invalid');
    }

    validateHttpContextResponseResponses(httpContext.response.responses);
}

function continueContent(statusCode, headers, content) {
    return JSON.stringify({
        statusCode: statusCode || 100,
        headers: headers || {},
        content: content || ''
    });
}

var isSuccessfulStatusCode = function (statusCode) {
    return statusCode === 200 || statusCode === 201 // OK or Created or
        || statusCode === 202 || statusCode === 203 // Accepted or Non-Authoritative Information or
        || statusCode === 204 || statusCode === 205 // No Content or Reset Content or
        || statusCode === 206;                      // Partial Content
};

var isValidHookContextResponse = function (response) {
    return typeof response === 'object' && response !== null
        && typeof response.statusCode === 'number' && response.statusCode > 0
        && typeof response.headers === 'object' && response.headers !== null
        && typeof response.content === 'string';
};

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
        var response = createResponse(
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
 * @method parseMultiResponse
 * @param {object} headers The headers of the response.
 * @param {string} content The content or body to parse.
 * @param {function} cb The node callback to invoke whenever the parsing succeeded or failed.
 */ 
var parseMultiResponse = function (headers, content, cb) {
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

HookContext.createResponse = createResponse;
HookContext.isSuccessfulStatusCode = isSuccessfulStatusCode;
HookContext.isValidHookContextResponse = isValidHookContextResponse;
HookContext.parseMultiResponse = parseMultiResponse;

module.exports = HookContext;
