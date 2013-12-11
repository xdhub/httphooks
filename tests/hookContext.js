var should = require('should');
var HookContext = require('../lib/hookContext.js');
var validStatusCodes = [ 200, 201, 202, 203, 204, 205, 206 ];
var invalidStatusCodes = [
    100, 101, 300, 301, 302,
    303, 304, 305, 306, 307,
    400, 401, 402, 403, 404,
    405, 406, 407, 408, 409,
    410, 411, 412, 413, 414,
    415, 416, 417, 500, 501,
    502, 503, 504, 505
];
var validHookContextResponses = [
    {
        statusCode: 200,
        headers: { },
        content: ''
    },
    {
        statusCode: 200,
        headers: { 'Content-Type': 'multipart/mixed; boundary=eaeaeaea' },
        content: 'This is some content'
    },
    {
        statusCode: 400,
        headers: {
            'Content-Type': 'multipart/mixed; boundary=eaeaeaea',
            'Content-Length': 22
        },
        content: 'This is a content test'
    }
];
var invalidHookContextResponses = [
    null,
    undefined,
    {},
    {
        statusCode: 505
    },
    {
        headers: { }
    },
    {
        content: ''
    },
    {
        statusCode: 505,
        headers: { }
    },
    {
        statusCode: 505,
        content: ''
    },
    {
        headers: { },
        content: ''
    },
    {
        statusCode: '404',
        headers: { },
        content: ''
    },
    {
        statusCode: 404,
        headers: 'a;b',
        content: ''
    },
    {
        statusCode: 404,
        headers: null,
        content: ''
    },
    {
        statusCode: 404,
        headers: { },
        content: 12345
    }
];
var validHttpContexts = [
    {
        request: {
            url: '',
            method: '',
            headers: {},
            content: ''
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            url: '',
            method: '',
            headers: {},
            content: ''
        },
        response: {
            responses: [ {} ]
        }
    },
    {
        request: {
            url: '/my/:bar',
            method: 'get',
            headers: {
                'Content-Length': 1
            },
            content: ' '
        },
        response: {
            responses: [ {} ]
        }
    }
];
var invalidHttpContexts = [
    null,
    undefined,
    {},
    {
        request: { }
    },
    {
        request: null
    },
    {
        response: { }
    },
    {
        response: null
    },
    {
        request: null,
        response: null
    },
    {
        request: null,
        response: { }
    },
    {
        request: { },
        response: null
    },
    {
        request: { },
        response: { }
    },
    {
        request: {
            url: ''
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            method: ''
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            headers: {}
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            content: ''
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            url: '',
            method: ''
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            url: '',
            headers: {}
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            url: '',
            content: ''
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            method: '',
            headers: {}
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            method: '',
            content: ''
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            headers: {},
            content: ''
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            url: '',
            method: '',
            headers: {}
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            url: '',
            method: '',
            content: ''
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            url: '',
            headers: {},
            content: ''
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            method: '',
            headers: {},
            content: ''
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            url: '',
            method: '',
            headers: {},
            content: ''
        },
        response: null
    },
    {
        request: {
            url: '',
            method: '',
            headers: {},
            content: ''
        },
        response: { }
    },
    {
        request: {
            url: '',
            method: '',
            headers: {},
            content: ''
        },
        response: {
            responses: null
        }
    },
    {
        request: null,
        response: {
            responses: []
        }
    }
];
var nonObjectTypes = [ 1, function () {}, 'asdfasdf', false ];
var nonStringTypes = [ 1, {}, [], function () {}, false ];
var nonFunctionTypes = [ 1, [], {}, 'asdfasdf', false ];
var invalidMultiResponseHeaders = [
    {},
    { 'Content-Length': 0 },
    { 'Content-Type': 'text/plain' },
    { 'Content-Type': 'application/javascript' },
    { 'Content-Type': 'audio/mp4' },
    { 'Content-Type': 'image/gif' },
    { 'Content-Type': 'image/gif', 'Content-Length': 0 },
    { 'Content-Type': 'multipart/mixed; boundary=b' },
];

describe('HookContext', function () {
    describe('Validate presence of the static definitions', function () {
        it('should provide a defined set of public functions', function () {
            var staticFunctions = [ 'createResponse', 'isSuccessfulStatusCode', 'isValidHookContextResponse' ];
            staticFunctions.forEach(function (fn) {
                var typeName = typeof HookContext[fn];
                typeName.should.equal('function', 'Expected function to be accessible: \'' + fn + '\'');
            });
        });
    });

    describe('#createResponse(value1, value2, value3)', function () {
        it('should initialize correctly when no arguments are provided and not throw any errors', function () {
            var response = HookContext.createResponse();
            response.statusCode.should.equal(-1);
            response.headers.should.be.empty;
            response.content.should.equal('');
            var typeName = typeof response.isSuccess;
            typeName.should.equal('function', 'Expected function to be accessible: \'isSuccess\'');
        });

        it('should initialize correctly when one argument is provided and not throw any errors', function () {
            var response = HookContext.createResponse(200);
            response.statusCode.should.equal(200);
            response.headers.should.be.empty;
            response.content.should.equal('');
            var typeName = typeof response.isSuccess;
            typeName.should.equal('function', 'Expected function to be accessible: \'isSuccess\'');
        });

        it('should initialize correctly when two arguments are provided and not throw any errors', function () {
            var headers = { 'Content-Type': 'multipart/mixed; boundary=123456' };
            var response = HookContext.createResponse(200, headers);
            response.statusCode.should.equal(200);
            response.headers.should.be.eql(headers);
            response.content.should.equal('');
            var typeName = typeof response.isSuccess;
            typeName.should.equal('function', 'Expected function to be accessible: \'isSuccess\'');
        });

        it('should initialize correctly when trhee arguments are provided and not throw any errors', function () {
            var headers = { 'Content-Type': 'multipart/mixed; boundary=123456' };
            var content = 'Min max algo';
            var response = HookContext.createResponse(200, headers, content);
            response.statusCode.should.equal(200);
            response.headers.should.be.eql(headers);
            response.content.should.equal(content);
            var typeName = typeof response.isSuccess;
            typeName.should.equal('function', 'Expected function to be accessible: \'isSuccess\'');
        });
    });

    describe('#isSuccessfulStatusCode(value)', function () {
        it('should return true when a valid status code is present', function () {
            validStatusCodes.forEach(function (statusCode) {
                HookContext.isSuccessfulStatusCode(statusCode).should.equal(true);
            });
        });

        it('should return false when an invalid status code is present', function () {
            invalidStatusCodes.forEach(function (statusCode) {
                HookContext.isSuccessfulStatusCode(statusCode).should.equal(false);
            });
        });
    });

    describe('#isValidHookContextResponse(value)', function () {
        it('should return true if a valid hook context response', function () {
            validHookContextResponses.forEach(function (response) {
                HookContext.isValidHookContextResponse(response).should.equal(true);
            });
        });

        it('should return false if an invalid hook context response', function () {
            invalidHookContextResponses.forEach(function (response) {
                HookContext.isValidHookContextResponse(response).should.equal(false);
            });
        });
    });

    describe('#Constructor(value)', function () {
        it('should not throw an error whenever the http context is valid', function () {
            validHttpContexts.forEach(function (httpContext) {
                var error = false;
                try {
                    new HookContext(httpContext);
                } catch (e) {
                    error = true;
                }

                error.should.equal(false, 'Expected no error being thrown for item: ' + httpContext ? JSON.stringify(httpContext) : typeof httpContext);
            });
        });

        it('should have the corresponding instance properties accessible after initializing an instance', function () {
            validHttpContexts.forEach(function (httpContext) {
                var hookContext = new HookContext(httpContext);
                (typeof hookContext.request).should.equal('object').should.not.be.empty;
                (typeof hookContext.request.method).should.equal('string');
                (typeof hookContext.request.url).should.equal('object').should.not.be.empty;
                (typeof hookContext.request.query).should.equal('object');
                (typeof hookContext.request.headers).should.equal('object');
                (typeof hookContext.request.content).should.equal('string');
                (typeof hookContext.request.json).should.equal('function');
                (typeof hookContext.response).should.equal('object').should.not.be.empty;
                (typeof hookContext.response.statusCode).should.equal('number');
                (typeof hookContext.response.headers).should.equal('object');
                (typeof hookContext.response.content).should.equal('string');
                (typeof hookContext.response.isSuccess).should.equal('function');
            });
        });

        it('should throw an error whenever the http context is invalid', function () {
            invalidHttpContexts.forEach(function (httpContext) {
                var error = false;
                try {
                    new HookContext(httpContext);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected error being thrown for item: ' + httpContext ? JSON.stringify(httpContext) : typeof httpContext);
            });
        });
    });

    describe('#parseMultiResponse(value1, value2, cb)', function () {
        it('should return an error when an invalid argument type for the first parameter is provided', function (done) {
            nonObjectTypes.forEach(function (headers) {
                var innerBodyBuffer = new Buffer(
                    '\r\n--b\r\n' +
                    'a' +
                    '\r\n--b--\r\n');
                var content = 'HTTP/1.1 200 OK\r\n' +
                    'Content-Length: ' + innerBodyBuffer.length + '\r\n' +
                    innerBodyBuffer.toString();
                HookContext.parseMultiResponse(headers, content, function (error, response) {
                    if (!error) {
                        done(new Error('Expected an error to be present'));
                    }
                });
            });
            done();
        });

        it('should return an error when an invalid argument value for the first parameter is provided', function (done) {
            invalidMultiResponseHeaders.forEach(function (headers) {
                var innerBodyBuffer = new Buffer(
                    '\r\n--b\r\n' +
                    'a' +
                    '\r\n--b--\r\n');
                var content = 'HTTP/1.1 200 OK\r\n' +
                    'Content-Length: ' + innerBodyBuffer.length + '\r\n' +
                    innerBodyBuffer.toString();
                HookContext.parseMultiResponse(headers, content, function (error, response) {
                    if (!error) {
                        done(new Error('Expected an error to be present'));
                    }
                });
            });
            done();
        });

        it('should return an error when an invalid argument type for the second parameter is provided', function (done) {
            nonStringTypes.forEach(function (content) {
                var headers = {
                    'Content-Type': 'multipart/mixed; boundary=b',
                    'Content-Length': 0
                };
                HookContext.parseMultiResponse(headers, content, function (error, response) {
                    if (!error) {
                        done(new Error('Expected an error to be present'));
                    }
                });
            });
            done();
        });

        it('should return an error when an invalid argument value for the second parameter is provided', function (done) {
            nonStringTypes.forEach(function (content) {
                var headers = {
                    'Content-Type': 'multipart/mixed; boundary=b',
                    'Content-Length': 0
                };
                HookContext.parseMultiResponse(headers, content, function (error, response) {
                    if (!error) {
                        done(new Error('Expected an error to be present'));
                    }
                });
            });
            done();
        });

        it('should throw an error when an invalid argument value for the third parameter is provided', function () {
            nonFunctionTypes.forEach(function (cb) {
                var content =
                    'preamble wha wha wha' + 
                    '\r\n--mYBounDarY 1234567890\r\n' +
                    'Content-Type: application/http\r\n' +
                    'Content-Transfer-Encoding: binary\r\n' +
                    '\r\n' +
                    'HTTP/1.1 200 OK\r\n' +
                    'Content-Type: text/plain\r\n' +
                    'Content-Length: 5\r\n' +
                    '\r\n' +
                    'hook1' +
                    '\r\n--mYBounDarY 1234567890\r\n' +
                    'Content-Type: application/http\r\n' +
                    'Content-Transfer-Encoding: binary\r\n' +
                    '\r\n' +
                    'HTTP/1.1 200 OK\r\n' +
                    'Content-Type: application/javascript\r\n' +
                    'Content-Length: 2\r\n' +
                    '\r\n' +
                    '{}' +
                    '\r\n--mYBounDarY 1234567890\r\n' +
                    'Content-Type: application/http\r\n' +
                    'Content-Transfer-Encoding: binary\r\n' +
                    '\r\n' +
                    'HTTP/1.1 200 OK\r\n' +
                    'Content-Type: text/csv\r\n' +
                    'Content-Length: 8\r\n' +
                    '\r\n' +
                    'hook,333' +
                    '\r\n--mYBounDarY 1234567890--\r\n' +
                    'epilogue some other things';
                var headers = {
                    'Content-Type': 'multipart/mixed; boundary=mYBounDarY 1234567890',
                    'Content-Length': new Buffer(content).length
                    };
                var error = false;
                try {
                    HookContext.parseMultiResponse(headers, content, cb);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected an error to be thrown for type: ' + typeof cb);
            });
        });

        it('should not throw an error and correctly parse the response when a well formed multi response is generated', function (done) {
            var content =
                'preamble wha wha wha' + 
                '\r\n--mYBounDarY 1234567890\r\n' +
                'Content-Type: application/http\r\n' +
                'Content-Transfer-Encoding: binary\r\n' +
                '\r\n' +
                'HTTP/1.1 200 OK\r\n' +
                'Content-Type: text/plain\r\n' +
                'Content-Length: 5\r\n' +
                '\r\n' +
                'hook1' +
                '\r\n--mYBounDarY 1234567890\r\n' +
                'Content-Type: application/http\r\n' +
                'Content-Transfer-Encoding: binary\r\n' +
                '\r\n' +
                'HTTP/1.1 200 OK\r\n' +
                'Content-Type: application/javascript\r\n' +
                'Content-Length: 2\r\n' +
                '\r\n' +
                '{}' +
                '\r\n--mYBounDarY 1234567890\r\n' +
                'Content-Type: application/http\r\n' +
                'Content-Transfer-Encoding: binary\r\n' +
                '\r\n' +
                'HTTP/1.1 200 OK\r\n' +
                'Content-Type: text/csv\r\n' +
                'Content-Length: 8\r\n' +
                '\r\n' +
                'hook,333' +
                '\r\n--mYBounDarY 1234567890--\r\n' +
                'epilogue some other things';
            var headers = {
                'Content-Type': 'multipart/mixed; boundary=mYBounDarY 1234567890',
                'Content-Length': new Buffer(content).length
                };
            HookContext.parseMultiResponse(headers, content, function (error, response) {
                if (error) {
                    done(error);
                } else {
                    response.should.not.be.empty;
                    response.should.have.properties(['subtype', 'boundaryValue', 'headers', 'parts', 'preamble', 'epilogue']);
                    response.subtype.should.equal('mixed');
                    response.boundaryValue.should.equal('mYBounDarY 1234567890');
                    response.headers.should.not.be.empty;
                    response.headers.should.have.properties(['Content-Type', 'Content-Length']);
                    response.headers['Content-Type'].should.equal('multipart/mixed; boundary=mYBounDarY 1234567890');
                    response.headers['Content-Length'].should.equal(580);
                    response.parts.should.not.be.empty;
                    response.parts.should.have.a.lengthOf(3);
                    response.parts.forEach(function (part) {
                        part.should.not.be.empty;
                        part.should.have.properties(['statusCode', 'headers', 'content']);
                        part.statusCode.should.equal(200);
                        part.headers.should.have.properties(['Content-Type', 'Content-Transfer-Encoding', 'Content-Length']);
                        part.headers['Content-Transfer-Encoding'].should.equal('binary');
                    });
                    response.parts[0].headers['Content-Type'].should.equal('text/plain');
                    response.parts[0].headers['Content-Length'].should.equal('5');
                    response.parts[0].content.should.equal('hook1');
                    response.parts[1].headers['Content-Type'].should.equal('application/javascript');
                    response.parts[1].headers['Content-Length'].should.equal('2');
                    response.parts[1].content.should.equal('{}');
                    response.parts[2].headers['Content-Type'].should.equal('text/csv');
                    response.parts[2].headers['Content-Length'].should.equal('8');
                    response.parts[2].content.should.equal('hook,333');
                    response.preamble.should.equal('preamble wha wha wha');
                    response.epilogue.should.equal('epilogue some other things');
                    done();
                }
            });
        });
    });
});

describe('response', function () {
    describe('#isSuccess()', function () {
        it('should return true when a valid status code is present', function () {
            validStatusCodes.forEach(function (statusCode) {
                var response = HookContext.createResponse(statusCode);
                response.isSuccess().should.equal(true);
            });
        });

        it('should return false when an invalid status code is present', function () {
            invalidStatusCodes.forEach(function (statusCode) {
                var response = HookContext.createResponse(statusCode);
                response.isSuccess().should.equal(false);
            });
        });
    });
});
