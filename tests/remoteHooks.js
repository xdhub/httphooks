var should = require('should');
var http = require('http');
var HttpHooks = require('../lib/httphooks.js');
var request = require('request');
var events = require('events');
var remoteHookEmitter = new events.EventEmitter();

describe('HttpHooks', function () {
    before(function () {
        if (typeof process.env.PORT1 !== 'string') {
            throw new Error('Expected PORT1 environment variable to be set before executing tests: e.g. 8080');
        }

        if (typeof process.env.PORT2 !== 'string') {
            throw new Error('Expected PORT2 environment variable to be set before executing tests: e.g. 8081');
        }
    });

    describe('http', function () {
        describe('#http remoteHooks', function() {
            var httpServer1 = null;
            var httpHooks1 = null;
            var httpServer2 = null;
            var httpHooks2 = null;
            var remoteHookInvoked = false;

            beforeEach(function () {
                remoteHookInvoked = false;
                httpHooks1 = new HttpHooks();
                httpServer1 = http.createServer(function (request, response) {
                    httpHooks1.dispatch({request: request, response: response});
                });

                httpHooks2 = new HttpHooks();
                httpServer2 = http.createServer(function (request, response) {
                    httpHooks2.dispatch({request: request, response: response});
                });
            });

            afterEach(function () {
                httpServer1.close();
                httpServer2.close();
                httpHooks1.clear();
                httpHooks2.clear();

                remoteHookEmitter.removeAllListeners();
                httpServer1 = null;
                httpServer2 = null;
                httpHooks1 = null;
                httpHooks2= null;
            });

            function validateRemoteHookInvoke(done, method, type) {
                var foundError = false;
                var responderContent = method + ' on ' + type;
                httpHooks1.noMatchHandler(function (httpContext) {
                    done(new Error('Expected hook to be found and invoked'));
                });
                var hook1 = {
                    method: method,
                    urlPattern: '/local/hook',
                    type: type,
                    callback: {
                        uri: 'http://localhost:' + process.env.PORT2 + '/remote/hook'
                    }

                };
                httpHooks1.addHook(hook1);
                var hook2 = {
                    method: method,
                    urlPattern: '/remote/hook',
                    type: type,
                    callback: function (hookContext, complete) {
                        remoteHookInvoked = true;
                        remoteHookEmitter.emit('invoked');
                        try {
                            hookContext.should.have.properties(['request', 'hook']);
                            hookContext.request.should.have.properties([ 'method', 'url', 'query', 'headers', 'content' ]);
                            hookContext.request.method.should.equal(method);
                            hookContext.request.url.should.have.property('path');
                            hookContext.request.url.path.should.equal('/remote/hook');
                            hookContext.hook.should.have.properties(['identifier', 'type', 'urlPattern']);
                            hookContext.hook.type.should.equal(type);
                            hookContext.hook.urlPattern.should.equal('/remote/hook');
                            hookContext.should.have.property('responseQueue');
                            hookContext.responseQueue.should.be.an.Array;
                            hookContext.responseQueue.should.be.empty;
                            var isResponder = hookContext.hook.type.indexOf('responder') !== -1;
                            if (isResponder || hookContext.hook.type === 'response-listener') {
                                hookContext.should.have.property('response');
                            }

                            if (isResponder) {
                                hookContext.setResponse(
                                    200,
                                    { 'Content-Type': 'text/html' },
                                    responderContent);
                            }
                        } catch (error) {
                            foundError = true;
                            done(error);
                        }

                        complete();
                    }
                };
                httpHooks2.noMatchHandler(function (httpContext) {
                    if (!foundError) {
                        done(new Error('Expected hook to be found and invoked'));
                    }
                });
                httpHooks2.addHook(hook2);
                httpServer2.listen(process.env.PORT2);
                httpServer1.listen(process.env.PORT1);

                var options = {
                    url: 'http://localhost:' + process.env.PORT1 + '/local/hook',
                    method: method
                };
                var isResponder = type.indexOf('responder') !== -1;
                var remoteHookInvokeValidationFunctor = function () {
                    if (!remoteHookInvoked) {
                        done(new Error('Expected remote hook to be invoked'));
                    } else {
                        done();
                    }
                };

                if (!isResponder) {
                    // listener hooks have not necessarily executed after the request is complete, so we proceed
                    // to only trigger the validation function when the hook is called. If this is never invoked
                    // then the test will timeout because done(...) is never called
                    remoteHookEmitter.on('invoked', remoteHookInvokeValidationFunctor);
                }

                request(options, function (error, response, body) {
                    if (!foundError) {
                        if (error) {
                            done(error);
                        } else if (response.statusCode !== 200) {
                            done(new Error('Expected a response status code equal to 200: ' + response.statusCode));
                        } else if (isResponder) {
                            // responder hooks should have completed execution after the response so we proceed
                            // to enforce this
                            remoteHookInvokeValidationFunctor();
                        }
                    }
                });
            }

            it('should find and invoke the defined hook for a GET request-listener', function (done) {
                validateRemoteHookInvoke(done, 'GET', 'request-listener');
            });

            it('should find and invoke the defined hook for a GET pre-listener', function (done) {
                validateRemoteHookInvoke(done, 'GET', 'pre-listener');
            });

            it('should find and invoke the defined hook for a GET post-listener', function (done) {
                validateRemoteHookInvoke(done, 'GET', 'post-listener');
            });

            it('should find and invoke the defined hook for a GET response-listener', function (done) {
                validateRemoteHookInvoke(done, 'GET', 'response-listener');
            });

            it('should find and invoke the defined hook for a PUT request-listener', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'request-listener');
            });

            it('should find and invoke the defined hook for a PUT pre-listener', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'pre-listener');
            });

            it('should find and invoke the defined hook for a PUT post-listener', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'post-listener');
            });

            it('should find and invoke the defined hook for a PUT response-listener', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'response-listener');
            });

            it('should find and invoke the defined hook for a POST request-listener', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'request-listener');
            });

            it('should find and invoke the defined hook for a POST pre-listener', function (done) {
                validateRemoteHookInvoke(done, 'POST', 'pre-listener');
            });

            it('should find and invoke the defined hook for a POST post-listener', function (done) {
                validateRemoteHookInvoke(done, 'POST', 'post-listener');
            });

            it('should find and invoke the defined hook for a POST response-listener', function (done) {
                validateRemoteHookInvoke(done, 'POST', 'response-listener');
            });

            it('should find and invoke the defined hook for a DELETE request-listener', function (done) {
                validateRemoteHookInvoke(done, 'DELETE', 'request-listener');
            });

            it('should find and invoke the defined hook for a DELETE pre-listener', function (done) {
                validateRemoteHookInvoke(done, 'DELETE', 'pre-listener');
            });

            it('should find and invoke the defined hook for a DELETE post-listener', function (done) {
                validateRemoteHookInvoke(done, 'DELETE', 'post-listener');
            });

            it('should find and invoke the defined hook for a DELETE response-listener', function (done) {
                validateRemoteHookInvoke(done, 'DELETE', 'response-listener');
            });

            it('should find and invoke the defined hook for a GET pre-responder', function (done) {
                validateRemoteHookInvoke(done, 'GET', 'pre-responder');
            });

            it('should find and invoke the defined hook for a GET responder', function (done) {
                validateRemoteHookInvoke(done, 'GET', 'responder');
            });

            it('should find and invoke the defined hook for a GET post-responder', function (done) {
                validateRemoteHookInvoke(done, 'GET', 'post-responder');
            });

            it('should find and invoke the defined hook for a PUT pre-responder', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'pre-responder');
            });

            it('should find and invoke the defined hook for a PUT responder', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'responder');
            });

            it('should find and invoke the defined hook for a PUT post-responder', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'post-responder');
            });

            it('should find and invoke the defined hook for a POST pre-responder', function (done) {
                validateRemoteHookInvoke(done, 'POST', 'pre-responder');
            });

            it('should find and invoke the defined hook for a POST in-responder', function (done) {
                validateRemoteHookInvoke(done, 'POST', 'responder');
            });

            it('should find and invoke the defined hook for a POST post-responder', function (done) {
                validateRemoteHookInvoke(done, 'POST', 'post-responder');
            });

            it('should find and invoke the defined hook for a DELETE pre-responder', function (done) {
                validateRemoteHookInvoke(done, 'DELETE', 'pre-responder');
            });

            it('should find and invoke the defined hook for a DELETE responder', function (done) {
                validateRemoteHookInvoke(done, 'DELETE', 'responder');
            });

            it('should find and invoke the defined hook for a DELETE post-responder', function (done) {
                validateRemoteHookInvoke(done, 'DELETE', 'post-responder');
            });
        });
    });

    describe('socket.io', function () {
        describe('#socket.io remoteHooks', function() {
            var ioServer1 = null;
            var httpHooks1 = null;
            var ioServer2 = null;
            var httpHooks2 = null;
            var clientSocket = null;
            var remoteHookInvoked = false;

            beforeEach(function () {
                remoteHookInvoked = false;
                httpHooks1 = new HttpHooks();
                ioServer1 = require('socket.io').listen(parseInt(process.env.PORT1));
                ioServer1.on('connection', function (socket) {
                    httpHooks1.dispatch({socket: socket, framework: 'socket.io'});
                });
                httpHooks2 = new HttpHooks();
                ioServer2 = require('socket.io').listen(parseInt(process.env.PORT2));
                ioServer2.on('connection', function (socket) {
                    httpHooks2.dispatch({socket: socket, framework: 'socket.io'});
                });
            });

            afterEach(function (done) {
                httpHooks1.clear();
                httpHooks2.clear();
                remoteHookEmitter.removeAllListeners();
                clientSocket.once('disconnect', function () {
                    clientSocket = null;
                    ioServer1.server.once('close', function () {
                        ioServer1 = null;
                        ioServer2.server.once('close', function () {
                            ioServer2 = null;
                            done();
                        });
                        ioServer2.server.close();
                    });
                    ioServer1.server.close();
                });
                clientSocket.disconnect();
                httpHooks1 = null;
                httpHooks2 = null;
            });

            function validateRemoteHookInvoke(done, method, type) {
                var foundError = false;
                var responderContent = method + ' on ' + type;
                httpHooks1.noMatchHandler(function (httpContext) {
                    done(new Error('Expected hook to be found and invoked'));
                });
                var hook1 = {
                    method: method,
                    urlPattern: '/local/hook',
                    type: type,
                    callback: {
                        uri: 'ws://127.0.0.1:' + process.env.PORT2 + '/remote/hook',
                        socketFramework: 'socket.io'
                    }
                };
                httpHooks1.addHook(hook1);
                var hook2 = {
                    method: method,
                    urlPattern: '/remote/hook',
                    type: type,
                    callback: function (hookContext, complete) {
                        remoteHookInvoked = true;
                        remoteHookEmitter.emit('invoked');
                        try {
                            hookContext.should.have.properties(['request', 'hook']);
                            hookContext.request.should.have.properties([ 'method', 'url', 'query', 'headers', 'content' ]);
                            hookContext.request.method.should.equal(method);
                            hookContext.request.url.should.have.property('path');
                            hookContext.request.url.path.should.equal('/remote/hook');
                            hookContext.hook.should.have.properties(['identifier', 'type', 'urlPattern']);
                            hookContext.hook.type.should.equal(type);
                            hookContext.hook.urlPattern.should.equal('/remote/hook');
                            hookContext.should.have.property('responseQueue');
                            hookContext.responseQueue.should.be.an.Array;
                            hookContext.responseQueue.should.be.empty;
                            var isResponder = hookContext.hook.type.indexOf('responder') !== -1;
                            if (isResponder || hookContext.hook.type === 'response-listener') {
                                hookContext.should.have.property('response');
                            }

                            if (isResponder) {
                                hookContext.setResponse(
                                    200,
                                    { 'Content-Type': 'text/html' },
                                    responderContent);
                            }
                        } catch (error) {
                            foundError = true;
                            done(error);
                        }

                        complete();
                    }
                };
                httpHooks2.noMatchHandler(function (httpContext) {
                    if (!foundError) {
                        done(new Error('Expected hook to be found and invoked'));
                    }
                });
                httpHooks2.addHook(hook2);

                var request = {
                    url: '/local/hook',
                    method: method,
                    headers: { 'Content-Type': 'plain/text' },
                    content: ''
                };
                var isResponder = type.indexOf('responder') !== -1;
                var remoteHookInvokeValidationFunctor = function () {
                    if (!remoteHookInvoked) {
                        done(new Error('Expected remote hook to be invoked'));
                    } else {
                        done();
                    }
                };

                if (!isResponder) {
                    // listener hooks have not necessarily executed after the request is complete, so we proceed
                    // to only trigger the validation function when the hook is called. If this is never invoked
                    // then the test will timeout because done(...) is never called
                    remoteHookEmitter.on('invoked', remoteHookInvokeValidationFunctor);
                }

                var remoteUrl = 'http://127.0.0.1:' + process.env.PORT1;
                clientSocket = require('socket.io-client').connect(remoteUrl, { 'force new connection': true });
                clientSocket.once('connect', function () {
                    clientSocket.emit('request', request, function (response) {
                        if (isResponder) {
                            // responder hooks should have completed execution after the response so we proceed
                            // to enforce this
                            remoteHookInvokeValidationFunctor();
                        }
                    });
                });
                clientSocket.once('connect_failed', function () {
                    done(new Error('connect_failed'));
                })
                clientSocket.once('error', function () {
                    done(new Error('error'));
                });
            }

            it('should find and invoke the defined hook for a GET request-listener', function (done) {
                validateRemoteHookInvoke(done, 'GET', 'request-listener');
            });

            it('should find and invoke the defined hook for a GET pre-listener', function (done) {
                validateRemoteHookInvoke(done, 'GET', 'pre-listener');
            });

            it('should find and invoke the defined hook for a GET post-listener', function (done) {
                validateRemoteHookInvoke(done, 'GET', 'post-listener');
            });

            it('should find and invoke the defined hook for a GET response-listener', function (done) {
                validateRemoteHookInvoke(done, 'GET', 'response-listener');
            });

            it('should find and invoke the defined hook for a PUT request-listener', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'request-listener');
            });

            it('should find and invoke the defined hook for a PUT pre-listener', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'pre-listener');
            });

            it('should find and invoke the defined hook for a PUT post-listener', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'post-listener');
            });

            it('should find and invoke the defined hook for a PUT response-listener', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'response-listener');
            });

            it('should find and invoke the defined hook for a POST request-listener', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'request-listener');
            });

            it('should find and invoke the defined hook for a POST pre-listener', function (done) {
                validateRemoteHookInvoke(done, 'POST', 'pre-listener');
            });

            it('should find and invoke the defined hook for a POST post-listener', function (done) {
                validateRemoteHookInvoke(done, 'POST', 'post-listener');
            });

            it('should find and invoke the defined hook for a POST response-listener', function (done) {
                validateRemoteHookInvoke(done, 'POST', 'response-listener');
            });

            it('should find and invoke the defined hook for a DELETE request-listener', function (done) {
                validateRemoteHookInvoke(done, 'DELETE', 'request-listener');
            });

            it('should find and invoke the defined hook for a DELETE pre-listener', function (done) {
                validateRemoteHookInvoke(done, 'DELETE', 'pre-listener');
            });

            it('should find and invoke the defined hook for a DELETE post-listener', function (done) {
                validateRemoteHookInvoke(done, 'DELETE', 'post-listener');
            });

            it('should find and invoke the defined hook for a DELETE response-listener', function (done) {
                validateRemoteHookInvoke(done, 'DELETE', 'response-listener');
            });

            it('should find and invoke the defined hook for a GET pre-responder', function (done) {
                validateRemoteHookInvoke(done, 'GET', 'pre-responder');
            });

            it('should find and invoke the defined hook for a GET responder', function (done) {
                validateRemoteHookInvoke(done, 'GET', 'responder');
            });

            it('should find and invoke the defined hook for a GET post-responder', function (done) {
                validateRemoteHookInvoke(done, 'GET', 'post-responder');
            });

            it('should find and invoke the defined hook for a PUT pre-responder', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'pre-responder');
            });

            it('should find and invoke the defined hook for a PUT responder', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'responder');
            });

            it('should find and invoke the defined hook for a PUT post-responder', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'post-responder');
            });

            it('should find and invoke the defined hook for a POST pre-responder', function (done) {
                validateRemoteHookInvoke(done, 'POST', 'pre-responder');
            });

            it('should find and invoke the defined hook for a POST in-responder', function (done) {
                validateRemoteHookInvoke(done, 'POST', 'responder');
            });

            it('should find and invoke the defined hook for a POST post-responder', function (done) {
                validateRemoteHookInvoke(done, 'POST', 'post-responder');
            });

            it('should find and invoke the defined hook for a DELETE pre-responder', function (done) {
                validateRemoteHookInvoke(done, 'DELETE', 'pre-responder');
            });

            it('should find and invoke the defined hook for a DELETE responder', function (done) {
                validateRemoteHookInvoke(done, 'DELETE', 'responder');
            });

            it('should find and invoke the defined hook for a DELETE post-responder', function (done) {
                validateRemoteHookInvoke(done, 'DELETE', 'post-responder');
            });
        });
    });

    describe('sockjs', function () {
        describe('#sockjs remoteHooks', function() {
            var sockjsServer1 = null;
            var httpServer1 = null;
            var httpHooks1 = null;
            var httpServer2 = null;
            var sockjsServer2 = null;
            var httpHooks2 = null;
            var client = null;
            var remoteHookInvoked = false;

            beforeEach(function () {
                remoteHookInvoked = false;
                httpHooks1 = new HttpHooks();
                sockjsServer1 = require('sockjs').createServer({ sockjs_url: 'http://cdn.sockjs.org/sockjs-0.3.min.js' });
                sockjsServer1.on('connection', function (connection) {
                    httpHooks1.dispatch({ socket: connection, framework: 'sockjs' });
                });
                httpServer1 = require('http').createServer(function (request, response) { });
                httpServer1.on('upgrade', function (request, response) {
                    response.end();
                });
                httpServer1.listen(process.env.PORT1);
                sockjsServer1.installHandlers(httpServer1);

                httpHooks2 = new HttpHooks();
                sockjsServer2 = require('sockjs').createServer({ sockjs_url: 'http://cdn.sockjs.org/sockjs-0.3.min.js' });
                sockjsServer2.on('connection', function (connection) {
                    httpHooks2.dispatch({ socket: connection, framework: 'sockjs' });
                });
                httpServer2 = require('http').createServer(function (request, response) { });
                httpServer2.on('upgrade', function (request, response) {
                    response.end();
                });
                httpServer2.listen(process.env.PORT2);
                sockjsServer2.installHandlers(httpServer2);
            });

            afterEach(function () {
                httpHooks1.clear();
                httpHooks2.clear();
                remoteHookEmitter.removeAllListeners();
                client.close();
                httpServer1.close();
                httpServer2.close();

                httpHooks1 = null;
                httpHooks2 = null;
                client = null;
                httpServer1 = null;
                httpServer2 = null;
                sockjsServer1 = null;
                sockjsServer2 = null;
            });

            function validateRemoteHookInvoke(done, method, type) {
                var foundError = false;
                var responderContent = method + ' on ' + type;
                httpHooks1.noMatchHandler(function (httpContext) {
                    done(new Error('Expected hook to be found and invoked'));
                });
                var hook1 = {
                    method: method,
                    urlPattern: '/local/hook',
                    type: type,
                    callback: {
                        uri: 'ws://127.0.0.1:' + process.env.PORT2 + '/remote/hook',
                        socketFramework: 'sockjs'
                    }
                };
                httpHooks1.addHook(hook1);
                var hook2 = {
                    method: method,
                    urlPattern: '/remote/hook',
                    type: type,
                    callback: function (hookContext, complete) {
                        remoteHookInvoked = true;
                        remoteHookEmitter.emit('invoked');
                        try {
                            hookContext.should.have.properties(['request', 'hook']);
                            hookContext.request.should.have.properties([ 'method', 'url', 'query', 'headers', 'content' ]);
                            hookContext.request.method.should.equal(method);
                            hookContext.request.url.should.have.property('path');
                            hookContext.request.url.path.should.equal('/remote/hook');
                            hookContext.hook.should.have.properties(['identifier', 'type', 'urlPattern']);
                            hookContext.hook.type.should.equal(type);
                            hookContext.hook.urlPattern.should.equal('/remote/hook');
                            hookContext.should.have.property('responseQueue');
                            hookContext.responseQueue.should.be.an.Array;
                            hookContext.responseQueue.should.be.empty;
                            var isResponder = hookContext.hook.type.indexOf('responder') !== -1;
                            if (isResponder || hookContext.hook.type === 'response-listener') {
                                hookContext.should.have.property('response');
                            }

                            if (isResponder) {
                                hookContext.setResponse(
                                    200,
                                    { 'Content-Type': 'text/html' },
                                    responderContent);
                            }
                        } catch (error) {
                            foundError = true;
                            done(error);
                        }

                        complete();
                    }
                };
                httpHooks2.noMatchHandler(function (httpContext) {
                    if (!foundError) {
                        done(new Error('Expected hook to be found and invoked'));
                    }
                });
                httpHooks2.addHook(hook2);

                var request = {
                    url: '/local/hook',
                    method: method,
                    headers: { 'Content-Type': 'plain/text' },
                    content: ''
                };
                var isResponder = type.indexOf('responder') !== -1;
                var remoteHookInvokeValidationFunctor = function () {
                    if (!remoteHookInvoked) {
                        done(new Error('Expected remote hook to be invoked'));
                    } else {
                        done();
                    }
                };

                if (!isResponder) {
                    // listener hooks have not necessarily executed after the request is complete, so we proceed
                    // to only trigger the validation function when the hook is called. If this is never invoked
                    // then the test will timeout because done(...) is never called
                    remoteHookEmitter.on('invoked', remoteHookInvokeValidationFunctor);
                }

                client = require('sockjs-client').create('http://127.0.0.1:' + process.env.PORT1 + '/');
                client.once('connection', function () {
                    client.write(JSON.stringify(request));
                });
                client.once('data', function (responseAsText) {
                    if (isResponder) {
                        // responder hooks should have completed execution after the response so we proceed
                        // to enforce this
                        remoteHookInvokeValidationFunctor();
                    }
                });
                client.once('error', function (error) {
                    done(error);
                });
            }

            it('should find and invoke the defined hook for a GET request-listener', function (done) {
                validateRemoteHookInvoke(done, 'GET', 'request-listener');
            });

            it('should find and invoke the defined hook for a GET pre-listener', function (done) {
                validateRemoteHookInvoke(done, 'GET', 'pre-listener');
            });

            it('should find and invoke the defined hook for a GET post-listener', function (done) {
                validateRemoteHookInvoke(done, 'GET', 'post-listener');
            });

            it('should find and invoke the defined hook for a GET response-listener', function (done) {
                validateRemoteHookInvoke(done, 'GET', 'response-listener');
            });

            it('should find and invoke the defined hook for a PUT request-listener', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'request-listener');
            });

            it('should find and invoke the defined hook for a PUT pre-listener', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'pre-listener');
            });

            it('should find and invoke the defined hook for a PUT post-listener', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'post-listener');
            });

            it('should find and invoke the defined hook for a PUT response-listener', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'response-listener');
            });

            it('should find and invoke the defined hook for a POST request-listener', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'request-listener');
            });

            it('should find and invoke the defined hook for a POST pre-listener', function (done) {
                validateRemoteHookInvoke(done, 'POST', 'pre-listener');
            });

            it('should find and invoke the defined hook for a POST post-listener', function (done) {
                validateRemoteHookInvoke(done, 'POST', 'post-listener');
            });

            it('should find and invoke the defined hook for a POST response-listener', function (done) {
                validateRemoteHookInvoke(done, 'POST', 'response-listener');
            });

            it('should find and invoke the defined hook for a DELETE request-listener', function (done) {
                validateRemoteHookInvoke(done, 'DELETE', 'request-listener');
            });

            it('should find and invoke the defined hook for a DELETE pre-listener', function (done) {
                validateRemoteHookInvoke(done, 'DELETE', 'pre-listener');
            });

            it('should find and invoke the defined hook for a DELETE post-listener', function (done) {
                validateRemoteHookInvoke(done, 'DELETE', 'post-listener');
            });

            it('should find and invoke the defined hook for a DELETE response-listener', function (done) {
                validateRemoteHookInvoke(done, 'DELETE', 'response-listener');
            });

            it('should find and invoke the defined hook for a GET pre-responder', function (done) {
                validateRemoteHookInvoke(done, 'GET', 'pre-responder');
            });

            it('should find and invoke the defined hook for a GET responder', function (done) {
                validateRemoteHookInvoke(done, 'GET', 'responder');
            });

            it('should find and invoke the defined hook for a GET post-responder', function (done) {
                validateRemoteHookInvoke(done, 'GET', 'post-responder');
            });

            it('should find and invoke the defined hook for a PUT pre-responder', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'pre-responder');
            });

            it('should find and invoke the defined hook for a PUT responder', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'responder');
            });

            it('should find and invoke the defined hook for a PUT post-responder', function (done) {
                validateRemoteHookInvoke(done, 'PUT', 'post-responder');
            });

            it('should find and invoke the defined hook for a POST pre-responder', function (done) {
                validateRemoteHookInvoke(done, 'POST', 'pre-responder');
            });

            it('should find and invoke the defined hook for a POST in-responder', function (done) {
                validateRemoteHookInvoke(done, 'POST', 'responder');
            });

            it('should find and invoke the defined hook for a POST post-responder', function (done) {
                validateRemoteHookInvoke(done, 'POST', 'post-responder');
            });

            it('should find and invoke the defined hook for a DELETE pre-responder', function (done) {
                validateRemoteHookInvoke(done, 'DELETE', 'pre-responder');
            });

            it('should find and invoke the defined hook for a DELETE responder', function (done) {
                validateRemoteHookInvoke(done, 'DELETE', 'responder');
            });

            it('should find and invoke the defined hook for a DELETE post-responder', function (done) {
                validateRemoteHookInvoke(done, 'DELETE', 'post-responder');
            });
        });
    });
});
