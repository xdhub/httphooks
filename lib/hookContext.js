/**
 * @title HookContext Reference
 * @author Elmar Langholz
 */

var HookContextRequest = require('./hookContextRequest.js');
var HookContextResponse = require('./hookContextResponse.js');
var HookInformation = require('./hookInformation.js');
var MultipartParse = require('./multipartParse.js');
var clone = require('clone');

function validateContextRequest(request) {
    if (typeof request !== 'object' || request === null) {
        throw new TypeError('The provided context request is invalid');
    }

    if (typeof request.url !== 'string') {
        throw new TypeError('The provided context request url is invalid');
    }

    if (typeof request.method !== 'string') {
        throw new TypeError('The provided context request method is invalid');
    }

    if (typeof request.headers !== 'object' || request.headers === null) {
        throw new TypeError('The provided context request headers are invalid');
    }

    if (typeof request.content !== 'string') {
        throw new TypeError('The provided context request content is invalid');
    }
}

function validateContextResponse(response) {
    if (typeof response !== 'object' && response !== null) {
        throw new Error('The provided context response is invalid');
    }

    if (typeof response.statusCode !== 'number') {
        throw new TypeError('The provided context response status code is invalid');
    }

    if (typeof response.headers !== 'object' || response.headers === null) {
        throw new TypeError('The provided context response headers are invalid');
    }

    if (typeof response.content !== 'string') {
        throw new TypeError('The provided context response content is invalid');
    }
}

function validateContextResponseQueue(responses) {
    if (!(responses instanceof Array)) {
        throw new TypeError('The provided context response queue is invalid');
    }
}

function validateContext(context) {
    if (typeof context !== 'object' || context === null) {
        throw new Error('The provided context is invalid');
    }
}

function continueContent(statusCode, headers, content) {
    return JSON.stringify({
        statusCode: statusCode || 100,
        headers: headers || {},
        content: content || ''
    });
}

/**
 * Creates an Utilities object
 * @class Utilities
 */
/**
 * Parses a an HTTP response containing a multiple responses through multipart.
 * @method parseMultiResponse
 * @param {object} headers The headers of the response.
 * @param {string} content The content or body to parse.
 * @param {function} cb The node callback to invoke whenever the parsing succeeded or failed.
 */

/**
 * Create an HookContext object
 * @class HookContext
 * @member {HookInformation} hook The current hook's information.
 * @member {HookContextRequest} request The request object.
 * @member {HookContextResponse} [response] The response object. *Only provided for any responder or response-listener hook.*
 * @member {HookContextResponse[]} responseQueue The previous responses that have been provided by any responder hooks.
 * @member {Utilities} util Exposes the available utilities.
 */
/**
 * If the hook is a responder hook, it sets the response for the hook; otherwise,
 * the function is not provided.
 * @method setResponse
 * @param {number} statusCode The status code to use in the response.
 * @param {object} headers The headers to use in the response.
 * @param {string} content The content to use in the response.
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
var HookContext = function (context, hook) {
    validateContext(context);
    validateContextRequest(context.request);
    validateContextResponseQueue(context.responseQueue);
    this.request = HookContextRequest.createFromHttpRequest(context.request);
    this.responseQueue = clone(context.responseQueue);
    this.hook = HookInformation.createHookInformation(hook);
    this.util = {};
    this.util.parseMultiResponse = MultipartParse.parse;
    var isResponderHook = hook.type.indexOf('responder') !== -1;

    if (isResponderHook) {
        this.response = HookContextResponse.createResponse();
        this.setResponse = function (statusCode, headers, content) {
            if (typeof statusCode !== 'number') {
                throw new TypeError('Invalid status code: expected type to be a number');
            }

            if (statusCode <= 0) {
                throw new Error('Invalid status code value: expected a positive number');
            }

            this.response = HookContextResponse.createResponse(statusCode, headers, content);
        };

        if (hook.type === 'pre-responder') {
            this.replaceRequest = function (headers, content) {
                this.response.statusCode = 100;
                this.response.content = continueContent(100, headers, content);
            };
        }

        if (hook.type === 'post-responder') {
            this.replaceResponse = function (statusCode, headers, content) {
                this.response.statusCode = 100;
                this.response.content = continueContent(statusCode, headers, content);
            };
        }
    } else {
        if (hook.type === 'response-listener') {
            validateContextResponse(context.response);
            // Initially cloned the context response directly like so:
            // this.response = clone(context.response);
            // but this throws:
            // Uncaught TypeError: Cannot set property headersSent of #<OutgoingMessage> which has only a getter
            // Therefore, we use the below to make it feasible for the hook to access the response
            var response = JSON.stringify(context.response);
            this.response = JSON.parse(response);
        }
    }
};

module.exports = HookContext;
