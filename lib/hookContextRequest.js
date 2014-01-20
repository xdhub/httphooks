/**
 * @title HookContextRequest Reference
 * @author Elmar Langholz
 */

var querystring = require('querystring');
var url = require('url');
var clone = require('clone');

/**
 * Create an HookContextRequest object
 * @class HookContextRequest
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
var createFromHttpRequest = function (request) {
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
};

module.exports = {
    createFromHttpRequest: createFromHttpRequest
};
