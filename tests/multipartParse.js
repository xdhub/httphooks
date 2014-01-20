var should = require('should');
var MultipartParse = require('../lib/multipartParse.js');
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
            MultipartParse.parse(headers, content, function (error, response) {
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
            MultipartParse.parse(headers, content, function (error, response) {
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
            MultipartParse.parse(headers, content, function (error, response) {
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
            MultipartParse.parse(headers, content, function (error, response) {
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
                MultipartParse.parse(headers, content, cb);
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
        MultipartParse.parse(headers, content, function (error, response) {
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