var should = require('should');
var ServerResponse = require('../../lib/socketio/ServerResponse.js');

describe('ServerResponse', function () {
    describe('#Constructor(value)', function() {
        it('should have a default set of publicly accessible functions', function () {
            var instanceFunctions = [
                'getHeader', 'setHeader', 'removeHeader', 'setEncoding',
                'writeHead', 'write', 'end'
            ];
            var response = new ServerResponse();
            instanceFunctions.forEach(function (fn) {
                var typeName = typeof response[fn];
                typeName.should.equal('function', 'Expected function to be accessible: \'' + fn + '\'');
            })
        });

        it('should have a default set of publicly accessible properties', function () {
            var instanceProperties = [
                // Read-only properties:
                'headersSent',
                // Read and write properties:
                'statusCode', 'sendDate'
            ];
            var response = new ServerResponse();
            instanceProperties.forEach(function (property) {
                var typeName = typeof response[property];
                typeName.should.not.equal('undefined', 'Expected property to be accessible: \'' + property + '\'');
            });
        });

        it('should not throw an error upon no argument being passed for initialization', function () {
            var response = new ServerResponse();
            response.sendDate.should.equal(true);
            response.headersSent.should.equal(false);
            response.statusCode.should.equal(-1);
        });

        it('should not throw an error upon a valid options being passed for initialization', function () {
            var options = {
                properties: {
                    sendDate: false,
                    headersSent: true,
                    statusCode: 500
                }
            };
            var response = new ServerResponse(options);
            response.sendDate.should.equal(options.properties.sendDate);
            response.headersSent.should.equal(options.properties.headersSent);
            response.statusCode.should.equal(options.properties.statusCode);
        });
    });

    describe('End-to-end', function () {
        before(function () {
            if (typeof process.env.PORT !== 'string') {
                throw new Error('Expected PORT environment variable to be set before executing tests: e.g. 8080');
            }
        });

        var server = null;
        var client = null;
        beforeEach(function () {
            server = require('socket.io').listen(parseInt(process.env.PORT));
            client = require('socket.io-client').connect('http://127.0.0.1:' + process.env.PORT);
        });

        afterEach(function () {
            server.server.close();
            client.disconnect();

            server = null;
            client = null;
        });

        it('should correctly return the expected response', function (done) {
            var expectedRequest = {
                method: 'GET',
                url: '/hook',
                headers: {
                    'Content-Type': 'application/json'
                },
                content: {
                    message: 'Hello World'
                }
            };
            var expectedResponse = {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                content: {
                    message: 'Fences, in a row'
                }
            };
            server.sockets.on('connection', function (socket) {
                socket.on('request', function (request, responseCallback) {
                    request.should.eql(expectedRequest);
                    var response = new ServerResponse({
                        socketContext: socket,
                        socketResponseCallback: responseCallback
                    });
                    response.writeHead(expectedResponse.statusCode, expectedResponse.headers);
                    response.write(expectedResponse.content);
                    response.end();
                });
            });

            client.on('connect', function () {
                client.emit('request', expectedRequest, function (response) {
                    response.statusCode.should.equal(expectedResponse.statusCode);
                    response.headers.should.have.properties(['Content-Type', 'Date']);
                    response.headers['Content-Type'].should.equal(expectedResponse.headers['Content-Type']);
                    response.content.should.be.a.String;
                    var parsedContent = JSON.parse(response.content);
                    parsedContent.should.eql(expectedResponse.content);
                    done();
                });
            });
        });
    });
});