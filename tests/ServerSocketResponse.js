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

var should = require('should');
var ServerSocketResponse = require('../lib/ServerSocketResponse.js');

describe('ServerSocketResponse', function () {
    describe('#Constructor(value)', function() {
        it('should have a default set of publicly accessible functions', function () {
            var instanceFunctions = [
                'getHeader', 'setHeader', 'removeHeader', 'setEncoding',
                'writeHead', 'write', 'end'
            ];
            var response = new ServerSocketResponse();
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
            var response = new ServerSocketResponse();
            instanceProperties.forEach(function (property) {
                var typeName = typeof response[property];
                typeName.should.not.equal('undefined', 'Expected property to be accessible: \'' + property + '\'');
            });
        });

        it('should not throw an error upon no argument being passed for initialization', function () {
            var response = new ServerSocketResponse();
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
            var response = new ServerSocketResponse(options);
            response.sendDate.should.equal(options.properties.sendDate);
            response.headersSent.should.equal(options.properties.headersSent);
            response.statusCode.should.equal(options.properties.statusCode);
        });
    });

    describe('socket.io end-to-end', function () {
        before(function () {
            if (typeof process.env.PORT1 !== 'string') {
                throw new Error('Expected PORT1 environment variable to be set before executing tests: e.g. 8080');
            }
        });

        var server = null;
        var client = null;
        beforeEach(function () {
            server = require('socket.io').listen(parseInt(process.env.PORT1));
            client = require('socket.io-client').connect('http://127.0.0.1:' + process.env.PORT1, {'force new connection': true});
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
                    socket.responseCallback = responseCallback;
                    var response = new ServerSocketResponse({
                        socket: {
                            context: socket,
                            sendResponse: function (statusCode, headers, content, context) {
                                var response = { statusCode: statusCode, headers: headers, content: content };
                                context.responseCallback(response);
                            },
                            closedEventName: 'disconnect'
                        }
                    });
                    response.writeHead(expectedResponse.statusCode, expectedResponse.headers);
                    response.write(JSON.stringify(expectedResponse.content));
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

    describe('sockjs end-to-end', function () {
        before(function () {
            if (typeof process.env.PORT1 !== 'string') {
                throw new Error('Expected PORT1 environment variable to be set before executing tests: e.g. 8080');
            }
        });

        var httpServer = null;
        var server = null;
        var client = null;
        beforeEach(function () {
            server = require('sockjs').createServer({ sockjs_url: 'http://cdn.sockjs.org/sockjs-0.3.min.js' });
            httpServer = require('http').createServer(function (request, response) { });
            httpServer.on('upgrade', function (request, response) {
                response.end();
            });

            httpServer.listen(process.env.PORT1);
            server.installHandlers(httpServer);
            client = require('sockjs-client').create('http://127.0.0.1:' + process.env.PORT1 + '/');
        });

        afterEach(function () {
            httpServer.close();
            client.close();

            httpServer = null;
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
            server.on('connection', function (connection) {
                connection.on('data', function (requestAsText) {
                    var request = JSON.parse(requestAsText);
                    request.should.eql(expectedRequest);
                    var response = new ServerSocketResponse({
                        socket: {
                            context: connection,
                            sendResponse: function (statusCode, headers, content, context) {
                                var response = { statusCode: statusCode, headers: headers, content: content };
                                context.write(JSON.stringify(response));
                            },
                            closedEventName: 'close'
                        }
                    });
                    response.writeHead(expectedResponse.statusCode, expectedResponse.headers);
                    response.write(JSON.stringify(expectedResponse.content));
                    response.end();
                });
            });
            client.on('connection', function () {
                client.write(JSON.stringify(expectedRequest));
            });
            client.on('data', function (responseAsText) {
                var response = JSON.parse(responseAsText);
                response.statusCode.should.equal(expectedResponse.statusCode);
                response.headers.should.have.properties(['Content-Type', 'Date']);
                response.headers['Content-Type'].should.equal(expectedResponse.headers['Content-Type']);
                response.content.should.be.a.String;
                var parsedContent = JSON.parse(response.content);
                parsedContent.should.eql(expectedResponse.content);
                done();
            });
            client.on('error', function (error) {
                done(error);
            });
        });
    });
});
