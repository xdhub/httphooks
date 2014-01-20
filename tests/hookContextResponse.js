var should = require('should');
var HookContextResponse = require('../lib/hookContextResponse.js');
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

describe('HookContextResponse', function () {
    describe('Validate presence of the static definitions', function () {
        it('should provide a defined set of public functions', function () {
            var staticFunctions = [ 'isValid', 'createResponse', 'isSuccessfulStatusCode' ];
            staticFunctions.forEach(function (fn) {
                var typeName = typeof HookContextResponse[fn];
                typeName.should.equal('function', 'Expected function to be accessible: \'' + fn + '\'');
            });
        });
    });

    describe('#createResponse(value1, value2, value3)', function () {
        it('should initialize correctly when no arguments are provided and not throw any errors', function () {
            var response = HookContextResponse.createResponse();
            response.statusCode.should.equal(-1);
            response.headers.should.be.empty;
            response.content.should.equal('');
            var typeName = typeof response.isSuccess;
            typeName.should.equal('function', 'Expected function to be accessible: \'isSuccess\'');
        });

        it('should initialize correctly when one argument is provided and not throw any errors', function () {
            var response = HookContextResponse.createResponse(200);
            response.statusCode.should.equal(200);
            response.headers.should.be.empty;
            response.content.should.equal('');
            var typeName = typeof response.isSuccess;
            typeName.should.equal('function', 'Expected function to be accessible: \'isSuccess\'');
        });

        it('should initialize correctly when two arguments are provided and not throw any errors', function () {
            var headers = { 'Content-Type': 'multipart/mixed; boundary=123456' };
            var response = HookContextResponse.createResponse(200, headers);
            response.statusCode.should.equal(200);
            response.headers.should.be.eql(headers);
            response.content.should.equal('');
            var typeName = typeof response.isSuccess;
            typeName.should.equal('function', 'Expected function to be accessible: \'isSuccess\'');
        });

        it('should initialize correctly when three arguments are provided and not throw any errors', function () {
            var headers = { 'Content-Type': 'multipart/mixed; boundary=123456' };
            var content = 'Min max algo';
            var response = HookContextResponse.createResponse(200, headers, content);
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
                HookContextResponse.isSuccessfulStatusCode(statusCode).should.equal(true);
            });
        });

        it('should return false when an invalid status code is present', function () {
            invalidStatusCodes.forEach(function (statusCode) {
                HookContextResponse.isSuccessfulStatusCode(statusCode).should.equal(false);
            });
        });
    });

    describe('#isValid(value)', function () {
        it('should return true if a valid hook context response', function () {
            validHookContextResponses.forEach(function (response) {
                HookContextResponse.isValid(response).should.equal(true);
            });
        });

        it('should return false if an invalid hook context response', function () {
            invalidHookContextResponses.forEach(function (response) {
                HookContextResponse.isValid(response).should.equal(false);
            });
        });
    });

    describe('#isSuccess()', function () {
        it('should return true when a valid status code is present', function () {
            validStatusCodes.forEach(function (statusCode) {
                var response = HookContextResponse.createResponse(statusCode);
                response.isSuccess().should.equal(true);
            });
        });

        it('should return false when an invalid status code is present', function () {
            invalidStatusCodes.forEach(function (statusCode) {
                var response = HookContextResponse.createResponse(statusCode);
                response.isSuccess().should.equal(false);
            });
        });
    });
});