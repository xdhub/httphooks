var should = require('should');
var MockHttp = require('./mocks/http/index.js');
var HttpHooks = require('../lib/httphooks.js');
var Multipart = require('../lib/multipart.js');
var constants = require('../lib/constants.js');
var nonObjectTypes = [ 1, function () {}, 'asdfasdf', false ];
var nonStringTypes = [ 1, {}, [], function () {}, false ];
var nonArrayTypes = [ 1, function () {}, {}, 'asdfasdf', false ];
var nonFunctionTypes = [ 1, [], {}, 'asdfasdf', false];
var invalidHookCallbackValues = [
    null,
    {},
    {
        uri: null
    },
    {
        func: null
    },
    {
        uri: null,
        func: null
    },
    {
        uri: 'file:///../tests/mockCallbackFile.js',
        func: null
    },
    {
        uri: null,
        func: 'hookFn'
    },
    {
        uri: 'file:///../tests/mockCallbackFile.js'
    },
    {
        func: 'hookFn'
    }
];
var invalidNoMatchCallbackValues = [
    null,
    {},
    {
        uri: null
    },
    {
        func: null
    },
    {
        uri: null,
        func: null
    },
    {
        uri: 'file:///../tests/mockCallbackFile.js',
        func: null
    },
    {
        uri: null,
        func: 'noMatchFn'
    },
    {
        uri: 'file:///../tests/mockCallbackFile.js'
    },
    {
        func: 'noMatchFn'
    }
];
var validHookCallbackValues = [
    function (hookContext, done) { done(); },
    {
        uri: 'file:///../tests/mockCallbackFile.js',
        func: 'hookFn'
    }
];
var validNoMatchCallbackValues = [
    function (httpContext, done) { done(); },
    {
        uri: 'file:///../tests/mockCallbackFile.js',
        func: 'noMatchFn'
    }
];
var invalidTypeValues = [
    'l', 'li', 'lis', 'list', 'liste',
    'listen', 'listene', 'listenes', 'listeners',
    'r', 're', 'res', 'resp', 'respo',
    'respon', 'respond', 'responde', 'respondet',
    'responders', 'pre-l', 'post-l', 'request-l',
    'response-l', 'pre-r', 'post-r'
];
var invalidHooksTypes = [ 1, function () {}, {}, 'asdfasdf' ];
var invalidHookValues = [
    null,
    undefined,
    1,
    function () {},
    {},
    'asdfasdf',
    {
        method: ''
    },
    {
        method: null
    },
    {
        method: 'GET'
    },
    {
        method: 'GET',
        urlPattern: null
    },
    {
        method: 'GET',
        urlPattern: '/this/is/my/topic'
    },
    {
        method: 'GET',
        urlPattern: '/this/is/my/topic',
        type: null
    },
    {
        method: 'GET',
        urlPattern: '/this/is/my/topic',
        type: ''
    },
    {
        method: 'GET',
        urlPattern: '/this/is/my/topic',
        type: 'ax'
    },
    {
        method: 'GET',
        urlPattern: '/this/is/my/topic',
        type: 'pre-listener'
    },
    {
        method: 'GET',
        urlPattern: '/this/is/my/topic',
        type: 'listener',
        order: 'in',
        callback: null
    },
    {
        method: 'GET',
        urlPattern: '/this/is/my/topic',
        type: 'pre-listener',
        callback: ''
    },
    {
        method: 'GET',
        urlPattern: '/this/is/my/topic',
        type: 'pre-listener',
        callback: {}
    },
    {
        method: 'GET',
        urlPattern: '/this/is/my/topic',
        type: 'pre-listener',
        callback: {}
    },
    {
        method: 'GET',
        urlPattern: '/this/is/my/topic',
        type: 'pre-listener',
        callback: {
            uri: null
        }
    },
    {
        method: 'GET',
        urlPattern: '/this/is/my/topic',
        type: 'pre-listener',
        callback: {
            uri: ''
        }
    },
    {
        method: 'GET',
        urlPattern: '/this/is/my/topic',
        type: 'pre-listener',
        callback: {
            uri: '',
            func: null
        }
    },
    {
        method: 'GET',
        urlPattern: '/this/is/my/topic',
        type: 'pre-listener',
        callback: {
            uri: '',
            func: ''
        }
    }
];
var validHookValues = constructValidHookValues();

function expandStringToLowerAndUpperCase(value) {
    return [ value.toLowerCase(), value.toUpperCase() ];
}

function constructValidHookValues() {
    var hooks = [];
    constants.requestMethods.map(expandStringToLowerAndUpperCase).forEach(function (methodSet) {
        methodSet.forEach(function (method) {
            constants.hookTypes.map(expandStringToLowerAndUpperCase).forEach(function (typeSet) {
                typeSet.forEach(function (type) {
                    validHookCallbackValues.forEach(function (callback) {
                        var hook = {
                            method: method,
                            urlPattern: '/',
                            type: type,
                            callback: callback
                        };
                        hooks.push(hook);
                    });
                });
            });
        });
    });

    return hooks;
}

function validateHooksCollectionIsEmpty(hooks) {
    validateHooksCollectionHasCount(hooks, 0);
}

function validateHooksCollectionHasCount(hooks, count) {
    var hooksCount = 0;
    constants.requestMethods.forEach(function (method) {
        var methodHooks = hooks.get(method);
        methodHooks.should.be.an.Object.and.should.not.be.empty;
        methodHooks.should.have.property('hooks');
        methodHooks.hooks.should.be.an.instanceof(Array);
        hooksCount += methodHooks.hooks.length;
    });
    hooksCount.should.equal(count);
}

function validateSingleHooksIsSet(hooks, urlPattern, method, type) {
    var methodHooks = hooks.get(method);
    methodHooks.should.be.an.Object.and.should.not.be.empty;
    methodHooks.should.have.property('hooks');
    methodHooks.hooks.should.be.an.instanceof(Array).with.lengthOf(1);
    methodHooks.hooks[0].urlPatternString.should.equal(urlPattern);
    methodHooks.hooks[0].method.should.equal(method);
    methodHooks.hooks[0].type.should.equal(type);
}

function validateHookInvoke(done, method, type) {
    var foundError = false;
    var url = '/my/documents?file=README.md';
    var dataBuffer = new Buffer('a!_ ][');
    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': dataBuffer.length
    };
    var data = dataBuffer.toString();
    var httpHooks = new HttpHooks();
    httpHooks.onNoMatch(function (httpContext) {
        if (!foundError) {
            done(new Error('Expected hook to be found and invoked'));
        }
    });
    var hook = {
        method: method,
        urlPattern: '/my/documents?file=:filename',
        type: type,
        callback: function (hookContext, complete) {
            try {
                hookContext.should.have.properties(['request', 'hook']);
                hookContext.request.should.have.properties([ 'method', 'url', 'query', 'headers', 'content' ]);
                hookContext.request.method.should.equal(method);
                hookContext.request.url.should.have.property('path');
                hookContext.request.url.path.should.equal(url);
                hookContext.request.headers.should.eql(headers);
                hookContext.request.content.should.equal(data);
                hookContext.hook.should.have.properties(['identifier', 'type', 'urlPattern']);
                hookContext.hook.type.should.equal(type);
                hookContext.hook.urlPattern.should.equal('/my/documents?file=:filename');
                hookContext.should.have.property('responseQueue');
                hookContext.responseQueue.should.be.an.Array;
                hookContext.responseQueue.should.be.empty;
                var isResponder = hookContext.hook.type.indexOf('responder') !== -1;
                if (isResponder || hookContext.hook.type === 'response-listener') {
                    hookContext.should.have.property('response');
                }
            } catch (error) {
                foundError = true;
                done(error);
            }

            complete();
        }
    };
    httpHooks.addHook(hook);
    var httpContext = {
        request: new MockHttp.IncommingMessage({
            method: method,
            url: url,
            headers: headers
        }),
        response: new MockHttp.ServerResponse()
    };
    httpContext.response.on('end', function () {
        if (!foundError) {
            done();
        }
    });
    httpHooks.dispatch(httpContext);
    httpContext.request.emit('data', data);
    httpContext.request.emit('end');
}

function validatePreResponderHookSuccessBeforeResponderHookInvoke(done, method) {
    var foundError = false;
    var url = '/my/documents?file=README.md';
    var requestDataBuffer = new Buffer('a!_ ][');
    var requestHeaders = {
        'Content-Type': 'application/json',
        'Content-Length': requestDataBuffer.length
    };
    var requestData = requestDataBuffer.toString();
    var responseDataBuffer = new Buffer('Success');
    var httpHooks = new HttpHooks();
    httpHooks.onNoMatch(function (httpContext) {
        done(new Error('Expected hook to be found and invoked'));
    });
    httpHooks.addHook({
        method: method,
        urlPattern: '/my/documents?file=:filename',
        type: 'pre-responder',
        callback: function (hookContext, complete) {
            try {
                hookContext.should.have.properties([ 'request', 'response' ]);
                hookContext.request.should.have.properties([ 'method', 'url', 'query', 'headers', 'content' ]);
                hookContext.request.method.should.equal(method);
                hookContext.request.url.should.have.property('path');
                hookContext.request.url.path.should.equal(url);
                hookContext.request.headers.should.eql(requestHeaders);
                hookContext.request.content.should.equal(requestData);
                hookContext.should.have.property('responseQueue');
                hookContext.responseQueue.should.be.an.Array;
                hookContext.responseQueue.should.be.empty;
                hookContext.response.statusCode = 200;
            } catch (error) {
                foundError = true;
                done(error);
            }

            complete();
        }
    });
    httpHooks.addHook({
        method: method,
        urlPattern: '/my/documents?file=:filename',
        type: 'responder',
        callback: function (hookContext, complete) {
            if (foundError) {
                complete();
                return;
            }

            try {
                hookContext.should.have.properties([ 'request', 'response' ]);
                hookContext.request.should.have.properties([ 'method', 'url', 'query', 'headers', 'content' ]);
                hookContext.request.method.should.equal(method);
                hookContext.request.url.should.have.property('path');
                hookContext.request.url.path.should.equal(url);
                hookContext.request.headers.should.eql(requestHeaders);
                hookContext.request.content.should.equal(requestData);
                hookContext.should.have.property('responseQueue');
                hookContext.responseQueue.should.be.an.Array;
                hookContext.responseQueue.should.be.empty;
                hookContext.response.statusCode = 200;
                hookContext.response.content = responseDataBuffer.toString();
            } catch (error) {
                foundError = true;
                done(error);
            }

            complete();
        }
    });
    var httpContext = {
        request: new MockHttp.IncommingMessage({
            method: method,
            url: url,
            headers: requestHeaders
        }),
        response: new MockHttp.ServerResponse()
    };
    httpContext.response.on('end', function () {
        if (!foundError) {
            httpContext.should.have.properties([ 'request', 'response' ]);
            httpContext.should.have.property('responseQueue');
            httpContext.response.statusCode.should.equal(200);
            httpContext.response._headers.should.eql({ 'Content-Length': responseDataBuffer.length });
            httpContext.response._data.should.not.be.empty;
            httpContext.response._data.should.have.a.lengthOf(1);
            httpContext.response._data[0].toString().should.equal(responseDataBuffer.toString());
            done();
        }
    });
    httpHooks.dispatch(httpContext);
    httpContext.request.emit('data', requestData);
    httpContext.request.emit('end');
}

function validatePostResponderHookSuccessAfterResponderHookInvoke(done, method) {
    var foundError = false;
    var url = '/my/documents?file=README.md';
    var requestDataBuffer = new Buffer('a!_ ][');
    var requestHeaders = {
        'Content-Type': 'application/json',
        'Content-Length': requestDataBuffer.length
    };
    var requestData = requestDataBuffer.toString();
    var responseDataBuffer = new Buffer('Success');
    var httpHooks = new HttpHooks();
    httpHooks.onNoMatch(function (httpContext) {
        done(new Error('Expected hook to be found and invoked'));
    });
    httpHooks.addHook({
        method: method,
        urlPattern: '/my/documents?file=:filename',
        type: 'responder',
        callback: function (hookContext, complete) {
            try {
                hookContext.should.have.properties([ 'request', 'response' ]);
                hookContext.request.should.have.properties([ 'method', 'url', 'query', 'headers', 'content' ]);
                hookContext.request.method.should.equal(method);
                hookContext.request.url.should.have.property('path');
                hookContext.request.url.path.should.equal(url);
                hookContext.request.headers.should.eql(requestHeaders);
                hookContext.request.content.should.equal(requestData);
                hookContext.should.have.property('responseQueue');
                hookContext.responseQueue.should.be.an.Array;
                hookContext.responseQueue.should.be.empty;
                hookContext.response.statusCode = 200;
                hookContext.response.content = responseDataBuffer.toString();
            } catch (error) {
                foundError = true;
                done(error);
            }

            complete();
        }
    });
    httpHooks.addHook({
        method: method,
        urlPattern: '/my/documents?file=:filename',
        type: 'post-responder',
        callback: function (hookContext, complete) {
            if (!foundError) {
                try {
                    hookContext.should.have.properties([ 'request', 'response' ]);
                    hookContext.request.should.have.properties([ 'method', 'url', 'query', 'headers', 'content' ]);
                    hookContext.request.method.should.equal(method);
                    hookContext.request.url.should.have.property('path');
                    hookContext.request.url.path.should.equal(url);
                    hookContext.request.headers.should.eql(requestHeaders);
                    hookContext.request.content.should.equal(requestData);
                    hookContext.should.have.property('responseQueue');
                    hookContext.responseQueue.should.be.an.Array;
                    hookContext.responseQueue.should.not.be.empty;
                    hookContext.responseQueue.should.have.a.lengthOf(1);
                    var response = hookContext.responseQueue[0];
                    response.statusCode.should.be.equal(200);
                    response.content.should.be.equal(responseDataBuffer.toString());
                    hookContext.response.statusCode = 200;
                } catch (error) {
                    foundError = true;
                    done(error);
                }

                complete();
            }
        }
    });
    var httpContext = {
        request: new MockHttp.IncommingMessage({
            method: method,
            url: url,
            headers: requestHeaders
        }),
        response: new MockHttp.ServerResponse()
    };
    httpContext.response.on('end', function () {
        if (!foundError) {
            httpContext.should.have.properties([ 'request', 'response' ]);
            httpContext.should.have.property('responseQueue');
            httpContext.response.statusCode.should.equal(200);
            httpContext.response._headers.should.eql({ 'Content-Length': responseDataBuffer.length });
            httpContext.response._data.should.not.be.empty;
            httpContext.response._data.should.have.a.lengthOf(1);
            httpContext.response._data[0].toString().should.equal(responseDataBuffer.toString());
            done();
        }
    });
    httpHooks.dispatch(httpContext);
    httpContext.request.emit('data', requestData);
    httpContext.request.emit('end');
}

function validatePreResponderHookFailureBeforeResponderHookInvoke(done, method) {
    var foundError = false;
    var url = '/my/documents?file=README.md';
    var requestDataBuffer = new Buffer('a!_ ][');
    var requestHeaders = {
        'Content-Type': 'application/json',
        'Content-Length': requestDataBuffer.length
    };
    var requestData = requestDataBuffer.toString();
    var responseDataBuffer = new Buffer('Failure');
    var responseData = responseDataBuffer.toString();
    var httpHooks = new HttpHooks();
    httpHooks.onNoMatch(function (httpContext) {
        done(new Error('Expected hook to be found and invoked'));
    });
    httpHooks.addHook({
        method: method,
        urlPattern: '/my/documents?file=:filename',
        type: 'pre-responder',
        callback: function (hookContext, complete) {
            try {
                hookContext.should.have.properties([ 'request', 'response' ]);
                hookContext.request.should.have.properties([ 'method', 'url', 'query', 'headers', 'content' ]);
                hookContext.request.method.should.equal(method);
                hookContext.request.url.should.have.property('path');
                hookContext.request.url.path.should.equal(url);
                hookContext.request.headers.should.eql(requestHeaders);
                hookContext.request.content.should.equal(requestData);
                hookContext.should.have.property('responseQueue');
                hookContext.responseQueue.should.be.an.Array;
                hookContext.responseQueue.should.be.empty;
                hookContext.response.statusCode = 400;
                hookContext.response.content = responseData;
            } catch (error) {
                foundError = true;
                done(error);
            }

            complete();
        }
    });
    httpHooks.addHook({
        method: method,
        urlPattern: '/my/documents?file=:filename',
        type: 'responder',
        callback: function (hookContext, complete) {
            done(new Error('Expected the in-responder hook for \'' + method + '\' to not be invoked'));
            foundError = true;
            complete();
        }
    });
    var httpContext = {
        request: new MockHttp.IncommingMessage({
            method: method,
            url: url,
            headers: requestHeaders
        }),
        response: new MockHttp.ServerResponse()
    };
    httpContext.response.on('end', function () {
        if (!foundError) {
            httpContext.should.have.properties([ 'request', 'response' ]);
            httpContext.should.have.property('responseQueue');
            httpContext.response.statusCode.should.equal(400);
            httpContext.response._headers.should.eql({ 'Content-Length': responseDataBuffer.length });
            httpContext.response._data.should.not.be.empty;
            httpContext.response._data.should.have.a.lengthOf(1);
            httpContext.response._data[0].toString().should.equal(responseData);
            done();
        }
    });
    httpHooks.dispatch(httpContext);
    httpContext.request.emit('data', requestData);
    httpContext.request.emit('end');
}

function validatePostResponderHookFailureAfterResponderHookInvoke(done, method) {
    var foundError = false;
    var url = '/my/documents?file=README.md';
    var requestDataBuffer = new Buffer('a!_ ][');
    var requestHeaders = {
        'Content-Type': 'application/json',
        'Content-Length': requestDataBuffer.length
    };
    var requestData = requestDataBuffer.toString();
    var intermediateDataBuffer = new Buffer('Success');
    var intermediateData = intermediateDataBuffer.toString();
    var responseDataBuffer = new Buffer('Failure');
    var responseData = responseDataBuffer.toString();
    var httpHooks = new HttpHooks();
    httpHooks.onNoMatch(function (httpContext) {
        foundError = true;
        done(new Error('Expected hook to be found and invoked'));
    });
    httpHooks.addHook({
        method: method,
        urlPattern: '/my/documents?file=:filename',
        type: 'responder',
        callback: function (hookContext, complete) {
            try {
                hookContext.should.have.properties([ 'request', 'response' ]);
                hookContext.request.should.have.properties([ 'method', 'url', 'query', 'headers', 'content' ]);
                hookContext.request.method.should.equal(method);
                hookContext.request.url.should.have.property('path');
                hookContext.request.url.path.should.equal(url);
                hookContext.request.headers.should.eql(requestHeaders);
                hookContext.request.content.should.equal(requestData);
                hookContext.should.have.property('responseQueue');
                hookContext.responseQueue.should.be.an.Array;
                hookContext.responseQueue.should.be.empty;
                hookContext.response.statusCode = 200;
                hookContext.response.content = intermediateData;
            } catch (error) {
                foundError = true;
                done(error);
            }

            complete();
        }
    });
    httpHooks.addHook({
        method: method,
        urlPattern: '/my/documents?file=:filename',
        type: 'post-responder',
        callback: function (hookContext, complete) {
            if (!foundError) {
                try {
                    hookContext.should.have.properties([ 'request', 'response' ]);
                    hookContext.request.should.have.properties([ 'method', 'url', 'query', 'headers', 'content' ]);
                    hookContext.request.method.should.equal(method);
                    hookContext.request.url.should.have.property('path');
                    hookContext.request.url.path.should.equal(url);
                    hookContext.request.headers.should.eql(requestHeaders);
                    hookContext.request.content.should.equal(requestData);
                    hookContext.should.have.property('responseQueue');
                    hookContext.responseQueue.should.be.an.Array;
                    hookContext.responseQueue.should.not.be.empty;
                    hookContext.responseQueue.should.have.a.lengthOf(1);
                    var response = hookContext.responseQueue[0];
                    response.statusCode.should.be.equal(200);
                    response.content.should.be.equal(intermediateData);
                    hookContext.response.statusCode = 400;
                    hookContext.response.content = responseData;
                } catch (error) {
                    foundError = true;
                    done(error);
                }
            }

            complete();

        }
    });
    var httpContext = {
        request: new MockHttp.IncommingMessage({
            method: method,
            url: url,
            headers: requestHeaders
        }),
        response: new MockHttp.ServerResponse()
    };
    httpContext.response.on('end', function () {
        if (!foundError) {
            httpContext.should.have.properties([ 'request', 'response' ]);
            httpContext.should.have.property('responseQueue');
            httpContext.response.statusCode.should.equal(400);
            httpContext.response._headers.should.eql({ 'Content-Length': responseDataBuffer.length });
            httpContext.response._data.should.not.be.empty;
            httpContext.response._data.should.have.a.lengthOf(1);
            httpContext.response._data[0].toString().should.equal(responseData);
            done();
        }
    });
    httpHooks.dispatch(httpContext);
    httpContext.request.emit('data', requestData);
    httpContext.request.emit('end');
}

function validatePreResponderHookContinueBeforeResponderHookInvoke(done, method) {
    var foundError = false;
    var url = '/my/documents?file=README.md';
    var requestDataBuffer = new Buffer('a!_ ][');
    var requestHeaders = {
        'Content-Type': 'application/json',
        'Content-Length': requestDataBuffer.length
    };
    var requestData = requestDataBuffer.toString();
    var responseDataBuffer = new Buffer('Continue');
    var responseData = responseDataBuffer.toString();
    var continueDataBuffer = new Buffer('My Continue Data Buffer');
    var continueData = continueDataBuffer.toString();
    var httpHooks = new HttpHooks();
    httpHooks.onNoMatch(function (httpContext) {
        done(new Error('Expected hook to be found and invoked'));
    });
    httpHooks.addHook({
        method: method,
        urlPattern: '/my/documents?file=:filename',
        type: 'pre-responder',
        callback: function (hookContext, complete) {
            try {
                hookContext.should.have.properties([ 'request', 'response' ]);
                hookContext.request.should.have.properties([ 'method', 'url', 'query', 'headers', 'content' ]);
                hookContext.request.method.should.equal(method);
                hookContext.request.url.should.have.property('path');
                hookContext.request.url.path.should.equal(url);
                hookContext.request.headers.should.eql(requestHeaders);
                hookContext.request.content.should.equal(requestData);
                hookContext.should.have.property('responseQueue');
                hookContext.responseQueue.should.be.an.Array;
                hookContext.responseQueue.should.be.empty;
                hookContext.replaceRequest(
                    { 'Content-Type': 'application/json', 'X-Header-Me': 'woot' },
                    continueData);
            } catch (error) {
                foundError = true;
                done(error);
            }

            complete();
        }
    });
    httpHooks.addHook({
        method: method,
        urlPattern: '/my/documents?file=:filename',
        type: 'responder',
        callback: function (hookContext, complete) {
            if (!foundError) {
                try {
                    hookContext.should.have.properties([ 'request', 'response' ]);
                    hookContext.request.should.have.properties([ 'method', 'url', 'query', 'headers', 'content' ]);
                    hookContext.request.method.should.equal(method);
                    hookContext.request.url.should.have.property('path');
                    hookContext.request.url.path.should.equal(url);
                    hookContext.request.content.should.equal(continueData);
                    hookContext.request.headers.should.eql({
                        'Content-Type': 'application/json',
                        'X-Header-Me': 'woot',
                        'Content-Length': continueDataBuffer.length });
                    hookContext.request.content.should.equal(continueData);
                    hookContext.should.have.property('responseQueue');
                    hookContext.responseQueue.should.be.an.Array;
                    hookContext.responseQueue.should.be.empty;
                    hookContext.response.statusCode = 200;
                    hookContext.response.content = responseDataBuffer.toString();
                } catch (error) {
                    foundError = true;
                    done(error);
                }

                complete();
            }
        }
    });
    var httpContext = {
        request: new MockHttp.IncommingMessage({
            method: method,
            url: url,
            headers: requestHeaders
        }),
        response: new MockHttp.ServerResponse()
    };
    httpContext.response.on('end', function () {
        if (!foundError) {
            httpContext.should.have.properties([ 'request', 'response' ]);
            httpContext.should.have.property('responseQueue');
            httpContext.response.statusCode.should.equal(200);
            httpContext.response._headers.should.eql({ 'Content-Length': responseDataBuffer.length });
            httpContext.response._data.should.not.be.empty;
            httpContext.response._data.should.have.a.lengthOf(1);
            httpContext.response._data[0].toString().should.equal(responseData);
            done();
        }
    });
    httpHooks.dispatch(httpContext);
    httpContext.request.emit('data', requestData);
    httpContext.request.emit('end');
}

function validatePostResponderHookContinueAfterResponderHookInvoke(done, method) {
    var foundError = false;
    var url = '/my/documents?file=README.md';
    var requestDataBuffer = new Buffer('a!_ ][');
    var requestHeaders = {
        'Content-Type': 'application/json',
        'Content-Length': requestDataBuffer.length
    };
    var requestData = requestDataBuffer.toString();
    var intermediateDataBuffer = new Buffer('Success');
    var intermediateData = intermediateDataBuffer.toString();
    var continueDataBuffer = new Buffer('My Continue Data Buffer');
    var continueData = continueDataBuffer.toString();
    var httpHooks = new HttpHooks();
    httpHooks.onNoMatch(function (httpContext) {
        done(new Error('Expected hook to be found and invoked'));
    });
    httpHooks.addHook({
        method: method,
        urlPattern: '/my/documents?file=:filename',
        type: 'responder',
        callback: function (hookContext, complete) {
            try {
                hookContext.should.have.properties([ 'request', 'response' ]);
                hookContext.request.should.have.properties([ 'method', 'url', 'query', 'headers', 'content' ]);
                hookContext.request.method.should.equal(method);
                hookContext.request.url.should.have.property('path');
                hookContext.request.url.path.should.equal(url);
                hookContext.request.headers.should.eql(requestHeaders);
                hookContext.request.content.should.equal(requestData);
                hookContext.should.have.property('responseQueue');
                hookContext.responseQueue.should.be.an.Array;
                hookContext.responseQueue.should.be.empty;
                hookContext.response.statusCode = 200;
                hookContext.response.content = intermediateData;
            } catch (error) {
                foundError = true;
                done(error);
            }

            complete();
        }
    });
    httpHooks.addHook({
        method: method,
        urlPattern: '/my/documents?file=:filename',
        type: 'post-responder',
        callback: function (hookContext, complete) {
            if (!foundError) {
                try {
                    hookContext.should.have.properties([ 'request', 'response' ]);
                    hookContext.request.should.have.properties([ 'method', 'url', 'query', 'headers', 'content' ]);
                    hookContext.request.method.should.equal(method);
                    hookContext.request.url.should.have.property('path');
                    hookContext.request.url.path.should.equal(url);
                    hookContext.request.headers.should.eql(requestHeaders);
                    hookContext.request.content.should.equal(requestData);
                    hookContext.should.have.property('responseQueue');
                    hookContext.responseQueue.should.be.an.Array;
                    hookContext.responseQueue.should.not.be.empty;
                    hookContext.responseQueue.should.have.a.lengthOf(1);
                    var response = hookContext.responseQueue[0];
                    response.statusCode.should.be.equal(200);
                    response.content.should.be.equal(intermediateData);
                    hookContext.replaceResponse(
                        200,
                        { 'Content-Type': 'application/json', 'X-Header-Me': 'woot' },
                        continueData);
                } catch (error) {
                    foundError = true;
                    done(error);
                }

                complete();
            }
        }
    });
    var httpContext = {
        request: new MockHttp.IncommingMessage({
            method: method,
            url: url,
            headers: requestHeaders
        }),
        response: new MockHttp.ServerResponse()
    };
    httpContext.response.on('end', function () {
        if (!foundError) {
            httpContext.should.have.properties([ 'request', 'response' ]);
            httpContext.should.have.property('responseQueue');
            httpContext.response.statusCode.should.equal(200);
            httpContext.response._headers.should.eql({
                'Content-Type': 'application/json',
                'X-Header-Me': 'woot',
                'Content-Length': continueDataBuffer.length });
            httpContext.response._data.should.not.be.empty;
            httpContext.response._data.should.have.a.lengthOf(1);
            httpContext.response._data[0].toString().should.equal(continueData);
            done();
        }
    });
    httpHooks.dispatch(httpContext);
    httpContext.request.emit('data', requestData);
    httpContext.request.emit('end');
}

function validateMultipleResponderHooksInvokeWithSuccessResponse(done, method) {
    var foundError = false;
    var url = '/my/documents?file=README.md';
    var dataBuffer = new Buffer('a!_ ][');
    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': dataBuffer.length
    };
    var data = dataBuffer.toString();
    var httpHooks = new HttpHooks();
    httpHooks.onNoMatch(function (httpContext) {
        if (!foundError) {
            done(new Error('Expected hook to be found and invoked'));
        }
    });
    var hook1 = {
        method: method,
        urlPattern: '/my/documents?file=:filename',
        type: 'responder',
        callback: function (hookContext, complete) {
            try {
                hookContext.should.have.properties([ 'request', 'response' ]);
                hookContext.request.should.have.properties([ 'method', 'url', 'query', 'headers', 'content' ]);
                hookContext.request.method.should.equal(method);
                hookContext.request.url.should.have.property('path');
                hookContext.request.url.path.should.equal(url);
                hookContext.request.headers.should.eql(headers);
                hookContext.request.content.should.equal(data);
                hookContext.should.have.property('responseQueue');
                hookContext.responseQueue.should.be.an.Array;
                hookContext.responseQueue.should.be.empty;
                hookContext.response.statusCode = 200;
                hookContext.response.content = 'hook1';
            } catch (error) {
                foundError = true;
                done(error);
            }

            complete();
        }
    };
    httpHooks.addHook(hook1);
    var hook2 = {
        method: method,
        urlPattern: '/my/documents?file=:filename',
        type: 'responder',
        callback: function (hookContext, complete) {
            try {
                hookContext.should.have.properties([ 'request', 'response' ]);
                hookContext.request.should.have.properties([ 'method', 'url', 'query', 'headers', 'content' ]);
                hookContext.request.method.should.equal(method);
                hookContext.request.url.should.have.property('path');
                hookContext.request.url.path.should.equal(url);
                hookContext.request.headers.should.eql(headers);
                hookContext.request.content.should.equal(data);
                hookContext.should.have.property('responseQueue');
                hookContext.responseQueue.should.be.an.Array;
                hookContext.responseQueue.should.not.be.empty;
                hookContext.responseQueue.should.have.a.lengthOf(1);
                hookContext.responseQueue[0].should.include({
                    statusCode: 200,
                    headers: {},
                    content: 'hook1'
                });
                hookContext.response.statusCode = 200;
                hookContext.response.content = 'hook2';
            } catch (error) {
                foundError = true;
                done(error);
            }

            complete();
        }
    };
    httpHooks.addHook(hook2);
    var httpContext = {
        request: new MockHttp.IncommingMessage({
            method: method,
            url: url,
            headers: headers
        }),
        response: new MockHttp.ServerResponse()
    };
    httpContext.response.on('end', function () {
        if (!foundError) {
            try {
                httpContext.should.have.properties([ 'request', 'response' ]);
                httpContext.should.have.property('responseQueue');
                httpContext.response.statusCode.should.equal(202);
                httpContext.response._headers.should.have.properties(['Content-Type', 'Content-Length']);
                httpContext.response._data.should.not.be.empty;
                httpContext.response._data.should.have.a.lengthOf(1);
                var multipart = Multipart.parse(httpContext.response._headers, httpContext.response._data[0].toString());
                multipart.should.have.properties(['subtype', 'boundaryValue', 'parts', 'preamble', 'epilogue', 'headers']);
                multipart.subtype.should.equal('mixed');
                multipart.parts.should.not.be.empty;
                multipart.parts.should.have.a.lengthOf(2);
                multipart.parts[0].should.equal(
                    'Content-Type: application/http\r\n' +
                    'Content-Transfer-Encoding: binary\r\n' +
                    '\r\n' +
                    'HTTP/1.1 200 OK\r\n' +
                    'Content-Length: 5\r\n' +
                    '\r\n' +
                    'hook1');
                multipart.parts[1].should.equal(
                    'Content-Type: application/http\r\n' +
                    'Content-Transfer-Encoding: binary\r\n' +
                    '\r\n' +
                    'HTTP/1.1 200 OK\r\n' +
                    'Content-Length: 5\r\n' +
                    '\r\n' +
                    'hook2');
                done();
            } catch (error) {
                foundError = true;
                done(error);
            }
        }
    });
    httpHooks.dispatch(httpContext);
    httpContext.request.emit('data', data);
    httpContext.request.emit('end');
}

describe('HttpHooks', function () {
    describe('#Constructor(value)', function () {
        it('should not throw an error upon no value being passed for initialization', function () {
            (function () {
                var httpHooks = new HttpHooks();
                httpHooks.hooks.forEach(function (methodHooks, key) {
                    methodHooks.should.be.an.Object.and.should.not.be.empty;
                    methodHooks.should.have.property('hooks');
                    var hooks = methodHooks.hooks;
                    hooks.should.be.an.instanceof(Array).with.lengthOf(0);
                });
            }).should.not.throw();
        });

        it('should have a default set of publicly accessible functions', function () {
            var instanceFunctions = [
                'addHook', 'addHooks', 'removeHooks', 'removeHook', 'clear',
                'get', 'getListener', 'getRequestListener', 'getPreListener', 'getPostListener',
                'getResponseListener', 'getResponder', 'getPreResponder', 'getPostResponder',
                'put', 'putListener', 'putRequestListener', 'putPreListener', 'putPostListener',
                'putResponseListener', 'putResponder', 'putPreResponder', 'putPostResponder',
                'post', 'postListener', 'postRequestListener', 'postPreListener', 'postPostListener',
                'postResponseListener', 'postResponder', 'postPreResponder', 'postPostResponder',
                'delete', 'deleteListener', 'deleteRequestListener', 'deletePreListener', 'deletePostListener',
                'deleteResponseListener', 'deleteResponder', 'deletePreResponder', 'deletePostResponder',
                'dispatch', 'onNoMatch', 'asObserver'
            ];
            var httpHooks = new HttpHooks();
            instanceFunctions.forEach(function (fn) {
                var typeName = typeof httpHooks[fn];
                typeName.should.equal('function', 'Expected function to be accessible: \'' + fn + '\'');
            });
        });

        it('should have a default set of publicly accessible properties', function () {
            var instanceProperties = [ 'hooks' ];
            var httpHooks = new HttpHooks();
            instanceProperties.forEach(function (property) {
                var typeName = typeof httpHooks[property];
                typeName.should.not.equal('undefined', 'Expected property to be accessible: \'' + property + '\'');
            });
        });

        it('should throw an error upon invalid hooks type being passed for initialization', function () {
            invalidHooksTypes.forEach(function (hooks) {
                var error = false;
                try {
                    new HttpHooks(hooks);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof hooks);
            });
        });

        it('should throw an error upon invalid hook declarations being passed for initialization', function () {
            invalidHookValues.forEach(function (hook) {
                var error = false;
                try {
                    new HttpHooks([hook]);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof hook === 'object' ? JSON.stringify(hook) : typeof hook);
            });
        });

        it('should not throw an error upon a valid hook declaration is being passed for initialization', function () {
            validHookValues.forEach(function (hook) {
                var error = false;
                var httpHooks = null;
                try {
                    httpHooks = new HttpHooks([hook]);
                } catch (e) {
                    throw e;
                    error = true;
                }

                error.should.equal(false, 'Expected not to throw for item of type: ' + JSON.stringify(hook));
                validateSingleHooksIsSet(
                    httpHooks.hooks,
                    hook.urlPattern,
                    hook.method.toLowerCase(),
                    hook.type.toLowerCase());
            });
        });
    });

    describe('#addHook(value)', function () {
        it('should throw an error upon invalid hooks type being passed', function () {
            invalidHooksTypes.forEach(function (hook) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.addHook(hook);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof hook);
            });
        });

        it('should throw an error upon invalid hook declarations being passed', function () {
            invalidHookValues.forEach(function (hook) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.addHook(hook);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof hook === 'object' ? JSON.stringify(hook) : typeof hook);
            });
        });

        it('should not throw an error upon a valid hook declaration is being passed for initialization', function () {
            validHookValues.forEach(function (hook) {
                var error = false;
                var httpHooks = new HttpHooks();
                var identifier = null;
                try {
                    identifier = httpHooks.addHook(hook);
                } catch (e) {
                    error = true;
                }

                error.should.equal(false, 'Expected not to throw for item of type: ' + JSON.stringify(hook));
                identifier.should.be.a.String;
                validateSingleHooksIsSet(
                    httpHooks.hooks,
                    hook.urlPattern,
                    hook.method.toLowerCase(),
                    hook.type.toLowerCase());
            });
        });
    });

    describe('#addHooks(value)', function () {
        it('should throw an error upon invalid hooks type being passed', function () {
            invalidHooksTypes.forEach(function (hooks) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.addHooks(hooks);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof hooks);
            });
        });

        it('should throw an error upon invalid hook declarations being passed', function () {
            invalidHookValues.forEach(function (hook) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.addHooks([hook]);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof hook === 'object' ? JSON.stringify(hook) : typeof hook);
            });
        });

        it('should not throw an error upon a valid hook declaration is being passed for initialization', function () {
            validHookValues.forEach(function (hook) {
                var error = false;
                var httpHooks = new HttpHooks();
                var identifiers = null;
                try {
                    identifiers = httpHooks.addHooks([hook]);
                } catch (e) {
                    error = true;
                }

                error.should.equal(false, 'Expected not to throw for item of type: ' + JSON.stringify(hook));
                identifiers.should.be.instanceof(Array).with.lengthOf(1);
                identifiers[0].should.be.a.String;
                validateSingleHooksIsSet(
                    httpHooks.hooks,
                    hook.urlPattern,
                    hook.method.toLowerCase(),
                    hook.type.toLowerCase());
            });
        });

        it('should not throw an error upon multiple valid hook declarations being passed', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            var identifiers = null;
            try {
                identifiers = httpHooks.addHooks(validHookValues);
            } catch (e) {
                error = true;
            }

            error.should.equal(false, 'Expected not to throw for item');
            identifiers.should.be.an.Array;
            identifiers.forEach(function (identifier) {
                identifier.should.be.a.String;
            });
            validateHooksCollectionHasCount(httpHooks.hooks, validHookValues.length);
        });
    });

    describe('#removeHook(value)', function () {
        it('should throw an error upon invalid identifier types being passed', function () {
            nonStringTypes.forEach(function (identifier) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.removeHook(identifier);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof identifier);
            });
        });

        it('should throw an error upon an identifier not present is being passed', function () {
            var identifier = 'ea';
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.removeHook(identifier);
            } catch (e) {
                error = true;
            }

            error.should.equal(true, 'Expected throw for item: ' + identifier);
        });

        it('should not throw an error upon a valid present identifier is being passed', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            var identifiers = httpHooks.addHooks(validHookValues);
            identifiers.forEach(function (identifier) {
                try {
                    httpHooks.removeHook(identifier);
                } catch (e) {
                    error = true;
                }

                error.should.equal(false, 'Expected no throw for item: ' + identifier);
            });

            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });
    });

    describe('#removeHooks(value)', function () {
        it('should throw an error upon invalid identifiers types being passed', function () {
            nonArrayTypes.forEach(function (identifiers) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.removeHooks(identifiers);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof identifiers);
            });
        });

        it('should throw an error upon invalid identifiers item types being passed', function () {
            nonStringTypes.forEach(function (identifier) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.removeHooks([identifier]);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof identifier);
            });
        });

        it('should throw an error upon an identifier not present is being passed', function () {
            var identifier = 'ea';
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.removeHooks([identifier]);
            } catch (e) {
                error = true;
            }

            error.should.equal(true, 'Expected throw for item: ' + identifier);
        });

        it('should not throw an error upon a valid present identifier is being passed', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            var identifiers = httpHooks.addHooks(validHookValues);
            try {
                httpHooks.removeHooks(identifiers);
            } catch (e) {
                error = true;
            }

            error.should.equal(false);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });
    });

    describe('#clear()', function () {
        it('should not throw an error upon hooks being present', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            httpHooks.addHooks(validHookValues);
            try {
                httpHooks.clear();
            } catch (e) {
                error = true;
            }

            error.should.equal(false);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should not throw an error upon hooks not being present', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.clear();
            } catch (e) {
                error = true;
            }

            error.should.equal(false);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });
    });

    describe('#get(value1, value2, value3)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.get('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'get', 'responder');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookTypes.map(expandStringToLowerAndUpperCase).forEach(function (typeSet) {
                    typeSet.forEach(function (type) {
                        var httpHooks = new HttpHooks();
                        httpHooks.get('/', callback, type);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'get',
                            type.toLowerCase());
                    });
                });
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.get();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.get(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.get('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.get('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.get('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.get('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof type);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidTypeValues.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.get('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + type + '\'');
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });
    });

    describe('#put(value1, value2, value3)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.put('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'put', 'responder');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookTypes.map(expandStringToLowerAndUpperCase).forEach(function (typeSet) {
                    typeSet.forEach(function (type) {
                        var httpHooks = new HttpHooks();
                        httpHooks.put('/', callback, type);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'put',
                            type.toLowerCase());
                    });
                });
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.put();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.put(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.put('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.put('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.put('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.put('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof type);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidTypeValues.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.put('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + type + '\'');
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });
    });

    describe('#post(value1, value2, value3)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.post('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'post', 'responder');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookTypes.map(expandStringToLowerAndUpperCase).forEach(function (typeSet) {
                    typeSet.forEach(function (type) {
                        var httpHooks = new HttpHooks();
                        httpHooks.post('/', callback, type);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'post',
                            type.toLowerCase());
                    });
                });
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.post();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.post(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.post('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.post('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.post('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.post('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof type);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidTypeValues.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.post('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + type + '\'');
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });
    });

    describe('#delete(value1, value2, value3)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.delete('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'delete', 'responder');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookTypes.map(expandStringToLowerAndUpperCase).forEach(function (typeSet) {
                    typeSet.forEach(function (type) {
                        var httpHooks = new HttpHooks();
                        httpHooks.delete('/', callback, type);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'delete',
                            type.toLowerCase());
                    });
                });
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.delete();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.delete(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.delete('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.delete('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.delete('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.delete('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof type);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidTypeValues.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.delete('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + type + '\'');
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });
    });

    describe('#getListener(value1, value2, value3)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.getListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'get', 'response-listener');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookListenerPrefixes.map(expandStringToLowerAndUpperCase).forEach(function (prefixSet) {
                    prefixSet.forEach(function (prefix) {
                        var httpHooks = new HttpHooks();
                        httpHooks.getListener('/', callback, prefix);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'get',
                            prefix.toLowerCase() + '-listener');
                    });
                });
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.getListener();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.getListener(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.getListener('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.getListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.getListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.getListener('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof type);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidTypeValues.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.getListener('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + type + '\'');
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });
    });

    describe('#putListener(value1, value2, value3)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.putListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'put', 'response-listener');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookListenerPrefixes.map(expandStringToLowerAndUpperCase).forEach(function (prefixSet) {
                    prefixSet.forEach(function (prefix) {
                        var httpHooks = new HttpHooks();
                        httpHooks.putListener('/', callback, prefix);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'put',
                            prefix.toLowerCase() + '-listener');
                    });
                });
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.putListener();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.putListener(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.putListener('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.putListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.putListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.putListener('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof type);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidTypeValues.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.putListener('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + type + '\'');
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });
    });

    describe('#postListener(value1, value2, value3)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.postListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'post', 'response-listener');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookListenerPrefixes.map(expandStringToLowerAndUpperCase).forEach(function (prefixSet) {
                    prefixSet.forEach(function (prefix) {
                        var httpHooks = new HttpHooks();
                        httpHooks.postListener('/', callback, prefix);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'post',
                            prefix.toLowerCase() + '-listener');
                    });
                });
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.postListener();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.postListener(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.postListener('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.postListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.postListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.postListener('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof type);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidTypeValues.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.postListener('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + type + '\'');
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });
    });

    describe('#deleteListener(value1, value2, value3)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.deleteListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'delete', 'response-listener');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookListenerPrefixes.map(expandStringToLowerAndUpperCase).forEach(function (prefixSet) {
                    prefixSet.forEach(function (prefix) {
                        var httpHooks = new HttpHooks();
                        httpHooks.deleteListener('/', callback, prefix);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'delete',
                            prefix.toLowerCase() + '-listener');
                    });
                });
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.deleteListener();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.deleteListener(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.deleteListener('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.deleteListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.deleteListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.deleteListener('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof type);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidTypeValues.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.deleteListener('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + type + '\'');
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });
    });

    describe('#getResponder(value1, value2, value3)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.getResponder('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'get', 'responder');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookResponderPrefixes.map(expandStringToLowerAndUpperCase).forEach(function (prefixSet) {
                    prefixSet.forEach(function (prefix) {
                        var httpHooks = new HttpHooks();
                        httpHooks.getResponder('/', callback, prefix);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'get',
                            prefix === '' ? 'responder' : prefix.toLowerCase() + '-responder');
                    });
                });
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.getResponder();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.getResponder(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.getResponder('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.getResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.getResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.getResponder('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof type);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidTypeValues.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.getResponder('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + type + '\'');
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });
    });

    describe('#putResponder(value1, value2, value3)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.putResponder('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'put', 'responder');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookResponderPrefixes.map(expandStringToLowerAndUpperCase).forEach(function (prefixSet) {
                    prefixSet.forEach(function (prefix) {
                        var httpHooks = new HttpHooks();
                        httpHooks.putResponder('/', callback, prefix);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'put',
                            prefix === '' ? 'responder' : prefix.toLowerCase() + '-responder');
                    });
                });
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.putResponder();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.putResponder(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.putResponder('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.putResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.putResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.putResponder('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof type);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidTypeValues.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.putResponder('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + type + '\'');
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });
    });

    describe('#postResponder(value1, value2, value3)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.postResponder('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'post', 'responder');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookResponderPrefixes.map(expandStringToLowerAndUpperCase).forEach(function (prefixSet) {
                    prefixSet.forEach(function (prefix) {
                        var httpHooks = new HttpHooks();
                        httpHooks.postResponder('/', callback, prefix);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'post',
                            prefix === '' ? 'responder' : prefix.toLowerCase() + '-responder');
                    });
                });
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.postResponder();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.postResponder(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.postResponder('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.postResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.postResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.postResponder('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof type);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidTypeValues.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.postResponder('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + type + '\'');
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });
    });

    describe('#deleteResponder(value1, value2, value3)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.deleteResponder('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'delete', 'responder');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookResponderPrefixes.map(expandStringToLowerAndUpperCase).forEach(function (prefixSet) {
                    prefixSet.forEach(function (prefix) {
                        var httpHooks = new HttpHooks();
                        httpHooks.deleteResponder('/', callback, prefix);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'delete',
                            prefix === '' ? 'responder' : prefix.toLowerCase() + '-responder');
                    });
                });
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.deleteResponder();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.deleteResponder(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.deleteResponder('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.deleteResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.deleteResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.deleteResponder('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof type);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the third is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidTypeValues.forEach(function (type) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.deleteResponder('/', callback, type);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + type + '\'');
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });
    });


    describe('#getRequestListener(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.getRequestListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'get', 'request-listener');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.getRequestListener();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.getRequestListener(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.getRequestListener('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.getRequestListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.getRequestListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#putRequestListener(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.putRequestListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'put', 'request-listener');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.putRequestListener();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.putRequestListener(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.putRequestListener('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.putRequestListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.putRequestListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#postRequestListener(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.postRequestListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'post', 'request-listener');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.postRequestListener();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.postRequestListener(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.postRequestListener('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.postRequestListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.postRequestListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#deleteRequestListener(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.deleteRequestListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'delete', 'request-listener');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.deleteRequestListener();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.deleteRequestListener(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.deleteRequestListener('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.deleteRequestListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.deleteRequestListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#getPreListener(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.getPreListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'get', 'pre-listener');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.getPreListener();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.getPreListener(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.getPreListener('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.getPreListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.getPreListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#putPreListener(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.putPreListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'put', 'pre-listener');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.putPreListener();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.putPreListener(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.putPreListener('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.putPreListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.putPreListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#postPreListener(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.postPreListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'post', 'pre-listener');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.postPreListener();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.postPreListener(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.postPreListener('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.postPreListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.postPreListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#deletePreListener(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.deletePreListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'delete', 'pre-listener');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.deletePreListener();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.deletePreListener(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.deletePreListener('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.deletePreListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.deletePreListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#getPostListener(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.getPostListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'get', 'post-listener');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.getPostListener();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.getPostListener(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.getPostListener('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.getPostListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.getPostListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#putPostListener(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.putPostListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'put', 'post-listener');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.putPostListener();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.putPostListener(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.putPostListener('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.putPostListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.putPostListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#postPostListener(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.postPostListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'post', 'post-listener');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.postPostListener();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.postPostListener(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.postPostListener('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.postPostListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.postPostListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#deletePostListener(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.deletePostListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'delete', 'post-listener');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.deletePostListener();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.deletePostListener(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.deletePostListener('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.deletePostListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.deletePostListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });


    describe('#getResponseListener(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.getResponseListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'get', 'response-listener');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.getResponseListener();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.getResponseListener(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.getResponseListener('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.getResponseListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.getResponseListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#putResponseListener(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.putResponseListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'put', 'response-listener');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.putResponseListener();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.putResponseListener(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.putResponseListener('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.putResponseListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.putResponseListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#postResponseListener(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.postResponseListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'post', 'response-listener');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.postResponseListener();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.postResponseListener(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.postResponseListener('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.postResponseListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.postResponseListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#deleteResponseListener(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.deleteResponseListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'delete', 'response-listener');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.deleteResponseListener();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.deleteResponseListener(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.deleteResponseListener('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.deleteResponseListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.deleteResponseListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#getPreResponder(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.getPreResponder('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'get', 'pre-responder');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.getPreResponder();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.getPreResponder(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.getPreResponder('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.getPreResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.getPreResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#putPreResponder(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.putPreResponder('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'put', 'pre-responder');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.putPreResponder();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.putPreResponder(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.putPreResponder('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.putPreResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.putPreResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#postPreResponder(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.postPreResponder('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'post', 'pre-responder');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.postPreResponder();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.postPreResponder(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.postPreResponder('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.postPreResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.postPreResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#deletePreResponder(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.deletePreResponder('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'delete', 'pre-responder');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.deletePreResponder();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.deletePreResponder(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.deletePreResponder('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.deletePreResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.deletePreResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#getPostResponder(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.getPostResponder('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'get', 'post-responder');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.getPostResponder();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.getPostResponder(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.getPostResponder('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.getPostResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.getPostResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#putPostResponder(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.putPostResponder('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'put', 'post-responder');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.putPostResponder();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.putPostResponder(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.putPostResponder('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.putPostResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.putPostResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#postPostResponder(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.postPostResponder('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'post', 'post-responder');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.postPostResponder();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.postPostResponder(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.postPostResponder('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.postPostResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.postPostResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#deletePostResponder(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.deletePostResponder('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'delete', 'post-responder');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.deletePostResponder();
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is not of a valid type', function () {
            nonStringTypes.forEach(function (urlPattern) {
                validHookCallbackValues.forEach(function (callback) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.deletePostResponder(urlPattern, callback);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof urlPattern);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first argument is valid and provided but not the required second', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.deletePostResponder('/');
            } catch (e) {
                error = true;
            }

            error.should.equal(true);
            validateHooksCollectionIsEmpty(httpHooks.hooks);
        });

        it('should throw an error when the first argument is valid and provided but the second is of an invalid type', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.deletePostResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });

        it('should throw an error when the first argument is valid and provided but the second is invalid', function () {
            invalidHookCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.deletePostResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#onNoMatch(value)', function () {
        it('should not throw an error when a valid argument is provided', function () {
            validNoMatchCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.onNoMatch(callback);
            });
        });

        it('should throw an error when an invalid argument type is provided', function () {
            nonFunctionTypes.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.onNoMatch(callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof callback);
            });
        });

        it('should throw an error when an invalid argument is provided', function () {
            invalidNoMatchCallbackValues.forEach(function (callback) {
                var error = false;
                var httpHooks = new HttpHooks();
                try {
                    httpHooks.onNoMatch(callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
            });
        });
    });

    describe('#dispatch(value)', function () {
        it('should not throw any errors whenever there is no matching hook', function (done) {
            var httpHooks = new HttpHooks();
            var httpContext = {
                request: new MockHttp.IncommingMessage(),
                response: new MockHttp.ServerResponse()
            };
            httpContext.response.on('end', function () {
                httpContext.response.statusCode.should.equal(404);
                var contentType = httpContext.response.getHeader('Content-Type');
                contentType.should.be.a.String;
                should.strictEqual('text/html', contentType);
                httpContext.response._data.join('').should.equal('Not Found');
                done();
            });
            httpHooks.dispatch(httpContext);
            httpContext.request.emit('end');
        });

        it('should not throw any errors whenever there is no matching hook and a no match listener', function (done) {
            var httpHooks = new HttpHooks();
            httpHooks.onNoMatch(function (httpContext) {
                httpContext.response.writeHead(500, { 'Content-Type': 'text/html' });
                httpContext.response.write('Internal Server Error Brah!');
                httpContext.response.end();
            });
            var httpContext = {
                request: new MockHttp.IncommingMessage(),
                response: new MockHttp.ServerResponse()
            };
            httpContext.response.on('end', function () {
                httpContext.response.statusCode.should.equal(500);
                var contentType = httpContext.response.getHeader('Content-Type');
                contentType.should.be.a.String;
                should.strictEqual('text/html', contentType);
                httpContext.response._data.join('').should.equal('Internal Server Error Brah!');
                done();
            });
            httpHooks.dispatch(httpContext);
            httpContext.request.emit('end');
        });

        it('should find and invoke the defined hook for a GET pre-listener', function (done) {
            validateHookInvoke(done, 'GET', 'request-listener');
        });

        it('should find and invoke the defined hook for a GET pre-listener', function (done) {
            validateHookInvoke(done, 'GET', 'pre-listener');
        });

        it('should find and invoke the defined hook for a GET post-listener', function (done) {
            validateHookInvoke(done, 'GET', 'post-listener');
        });

        it('should find and invoke the defined hook for a GET response-listener', function (done) {
            validateHookInvoke(done, 'GET', 'response-listener');
        });

        it('should find and invoke the defined hook for a PUT pre-listener', function (done) {
            validateHookInvoke(done, 'PUT', 'request-listener');
        });

        it('should find and invoke the defined hook for a PUT pre-listener', function (done) {
            validateHookInvoke(done, 'PUT', 'pre-listener');
        });

        it('should find and invoke the defined hook for a PUT post-listener', function (done) {
            validateHookInvoke(done, 'PUT', 'post-listener');
        });

        it('should find and invoke the defined hook for a PUT response-listener', function (done) {
            validateHookInvoke(done, 'PUT', 'response-listener');
        });

        it('should find and invoke the defined hook for a POST request-listener', function (done) {
            validateHookInvoke(done, 'PUT', 'request-listener');
        });

        it('should find and invoke the defined hook for a POST pre-listener', function (done) {
            validateHookInvoke(done, 'POST', 'pre-listener');
        });

        it('should find and invoke the defined hook for a POST post-listener', function (done) {
            validateHookInvoke(done, 'POST', 'post-listener');
        });

        it('should find and invoke the defined hook for a POST response-listener', function (done) {
            validateHookInvoke(done, 'POST', 'response-listener');
        });

        it('should find and invoke the defined hook for a DELETE request-listener', function (done) {
            validateHookInvoke(done, 'DELETE', 'request-listener');
        });

        it('should find and invoke the defined hook for a DELETE pre-listener', function (done) {
            validateHookInvoke(done, 'DELETE', 'pre-listener');
        });

        it('should find and invoke the defined hook for a DELETE post-listener', function (done) {
            validateHookInvoke(done, 'DELETE', 'post-listener');
        });

        it('should find and invoke the defined hook for a DELETE response-listener', function (done) {
            validateHookInvoke(done, 'DELETE', 'response-listener');
        });
        it('should find and invoke the defined hook for a GET pre-responder', function (done) {
            validateHookInvoke(done, 'GET', 'pre-responder');
        });

        it('should find and invoke the defined hook for a GET responder', function (done) {
            validateHookInvoke(done, 'GET', 'responder');
        });

        it('should find and invoke the defined hook for a GET post-responder', function (done) {
            validateHookInvoke(done, 'GET', 'post-responder');
        });

        it('should find and invoke the defined hook for a PUT pre-responder', function (done) {
            validateHookInvoke(done, 'PUT', 'pre-responder');
        });

        it('should find and invoke the defined hook for a PUT responder', function (done) {
            validateHookInvoke(done, 'PUT', 'responder');
        });

        it('should find and invoke the defined hook for a PUT post-responder', function (done) {
            validateHookInvoke(done, 'PUT', 'post-responder');
        });

        it('should find and invoke the defined hook for a POST pre-responder', function (done) {
            validateHookInvoke(done, 'POST', 'pre-responder');
        });

        it('should find and invoke the defined hook for a POST in-responder', function (done) {
            validateHookInvoke(done, 'POST', 'responder');
        });

        it('should find and invoke the defined hook for a POST post-responder', function (done) {
            validateHookInvoke(done, 'POST', 'post-responder');
        });

        it('should find and invoke the defined hook for a DELETE pre-responder', function (done) {
            validateHookInvoke(done, 'DELETE', 'pre-responder');
        });

        it('should find and invoke the defined hook for a DELETE responder', function (done) {
            validateHookInvoke(done, 'DELETE', 'responder');
        });

        it('should find and invoke the defined hook for a DELETE post-responder', function (done) {
            validateHookInvoke(done, 'DELETE', 'post-responder');
        });

        it('should correctly invoke a GET pre-responder hook prior to an in-responder when there is a valid status code returned by the former', function (done) {
            validatePreResponderHookSuccessBeforeResponderHookInvoke(done, 'GET');
        });

        it('should correctly invoke a PUT pre-responder hook prior to an in-responder when there is a valid status code returned by the former', function (done) {
            validatePreResponderHookSuccessBeforeResponderHookInvoke(done, 'PUT');
        });

        it('should correctly invoke a POST pre-responder hook prior to an in-responder when there is a valid status code returned by the former', function (done) {
            validatePreResponderHookSuccessBeforeResponderHookInvoke(done, 'POST');
        });

        it('should correctly invoke a DELETE pre-responder hook prior to an in-responder when there is a valid status code returned by the former', function (done) {
            validatePreResponderHookSuccessBeforeResponderHookInvoke(done, 'DELETE');
        });

        it('should correctly respond to a GET request with a post-responder hook after an in-responder when there is a valid status code returned by the former', function (done) {
            validatePostResponderHookSuccessAfterResponderHookInvoke(done, 'GET');
        });

        it('should correctly respond to a PUT request with a post-responder hook after an in-responder when there is a valid status code returned by the former', function (done) {
            validatePostResponderHookSuccessAfterResponderHookInvoke(done, 'PUT');
        });

        it('should correctly respond to a POST request with a post-responder hook after an in-responder when there is a valid status code returned by the former', function (done) {
            validatePostResponderHookSuccessAfterResponderHookInvoke(done, 'POST');
        });

        it('should correctly respond to a DELETE request with a post-responder hook after an in-responder when there is a valid status code returned by the former', function (done) {
            validatePostResponderHookSuccessAfterResponderHookInvoke(done, 'DELETE');
        });

        it('should correctly invoke a GET pre-responder hook but not an in-responder when there is an invalid status code returned by the latter', function (done) {
            validatePreResponderHookFailureBeforeResponderHookInvoke(done, 'GET');
        });

        it('should correctly invoke a PUT pre-responder hook but not an in-responder when there is an invalid status code returned by the latter', function (done) {
            validatePreResponderHookFailureBeforeResponderHookInvoke(done, 'PUT');
        });

        it('should correctly invoke a POST pre-responder hook but not an in-responder when there is an invalid status code returned by the latter', function (done) {
            validatePreResponderHookFailureBeforeResponderHookInvoke(done, 'POST');
        });

        it('should correctly invoke a DELETE pre-responder hook but not an in-responder when there is an invalid status code returned by the latter', function (done) {
            validatePreResponderHookFailureBeforeResponderHookInvoke(done, 'DELETE');
        });

        it('should correctly respond to a GET request with a post-responder hook after an in-responder when there is an invalid status code returned by the former', function (done) {
            validatePostResponderHookFailureAfterResponderHookInvoke(done, 'GET');
        });

        it('should correctly respond to a PUT request with a post-responder hook after an in-responder when there is an invalid status code returned by the former', function (done) {
            validatePostResponderHookFailureAfterResponderHookInvoke(done, 'PUT');
        });

        it('should correctly respond to a POST request with a post-responder hook after an in-responder when there is an invalid status code returned by the former', function (done) {
            validatePostResponderHookFailureAfterResponderHookInvoke(done, 'POST');
        });

        it('should correctly respond to a DELETE request with a post-responder hook after an in-responder when there is an invalid status code returned by the former', function (done) {
            validatePostResponderHookFailureAfterResponderHookInvoke(done, 'DELETE');
        });

        it('should correctly invoke a GET pre-responder hook prior to an in-responder when there is a continue status code returned by the former', function (done) {
            validatePreResponderHookContinueBeforeResponderHookInvoke(done, 'GET');
        });

        it('should correctly invoke a PUT pre-responder hook prior to an in-responder when there is a continue status code returned by the former', function (done) {
            validatePreResponderHookContinueBeforeResponderHookInvoke(done, 'PUT');
        });

        it('should correctly invoke a POST pre-responder hook prior to an in-responder when there is a continue status code returned by the former', function (done) {
            validatePreResponderHookContinueBeforeResponderHookInvoke(done, 'POST');
        });

        it('should correctly invoke a DELETE pre-responder hook prior to an in-responder when there is a continue status code returned by the former', function (done) {
            validatePreResponderHookContinueBeforeResponderHookInvoke(done, 'DELETE');
        });

        it('should correctly respond to a GET request with a post-responder hook after an in-responder when there is a continue status code returned by the former', function (done) {
            validatePostResponderHookContinueAfterResponderHookInvoke(done, 'GET');
        });

        it('should correctly respond to a PUT request with a post-responder hook after an in-responder when there is a continue status code returned by the former', function (done) {
            validatePostResponderHookContinueAfterResponderHookInvoke(done, 'PUT');
        });

        it('should correctly respond to a POST request with a post-responder hook after an in-responder when there is a continue status code returned by the former', function (done) {
            validatePostResponderHookContinueAfterResponderHookInvoke(done, 'POST');
        });

        it('should correctly respond to a DELETE request with a post-responder hook after an in-responder when there is a continue status code returned by the former', function (done) {
            validatePostResponderHookContinueAfterResponderHookInvoke(done, 'DELETE');
        });

        it('should correctly respond to a GET request with multiple in-responder hooks returning a successful status code', function (done) {
            validateMultipleResponderHooksInvokeWithSuccessResponse(done, 'GET');
        });

        it('should correctly respond to a PUT request with multiple in-responder hooks returning a successful status code', function (done) {
            validateMultipleResponderHooksInvokeWithSuccessResponse(done, 'PUT');
        });

        it('should correctly respond to a POST request with multiple in-responder hooks returning a successful status code', function (done) {
            validateMultipleResponderHooksInvokeWithSuccessResponse(done, 'POST');
        });

        it('should correctly respond to a DELETE request with multiple in-responder hooks returning a successful status code', function (done) {
            validateMultipleResponderHooksInvokeWithSuccessResponse(done, 'DELETE');
        });
    });
});
