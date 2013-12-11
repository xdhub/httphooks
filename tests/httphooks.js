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
        path: null
    },
    {
        func: null
    },
    {
        path: null,
        func: null
    },
    {
        path: '../tests/mockCallbackFile.js',
        func: null
    },
    {
        path: null,
        func: 'hookFn'
    },
    {
        path: '../tests/mockCallbackFile.js'
    },
    {
        func: 'hookFn'
    }
];
var invalidNoMatchCallbackValues = [
    null,
    {},
    {
        path: null
    },
    {
        func: null
    },
    {
        path: null,
        func: null
    },
    {
        path: '../tests/mockCallbackFile.js',
        func: null
    },
    {
        path: null,
        func: 'noMatchFn'
    },
    {
        path: '../tests/mockCallbackFile.js'
    },
    {
        func: 'noMatchFn'
    }
];
var validHookCallbackValues = [
    function (hookContext) {},
    {
        path: '../tests/mockCallbackFile.js',
        func: 'hookFn'
    }
];
var validNoMatchCallbackValues = [
    function (httpContext) {},
    {
        path: '../tests/mockCallbackFile.js',
        func: 'noMatchFn'
    }
];
var invalidOrderValues = [
    'i', 'p', 'pr',
    'po', 'pos', 'im', 'inf',
    'inin', 'pra', 'pres', 'prepre',
    'poss', 'posti', 'postpost'
];
var invalidTypeValues = [
    'l', 'li', 'lis', 'list', 'liste',
    'listen', 'listene', 'listenes', 'listeners',
    'r', 're', 'res', 'resp', 'respo',
    'respon', 'respond', 'responde', 'respondet',
    'responders'
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
        type: 'listener'
    },
    {
        method: 'GET',
        urlPattern: '/this/is/my/topic',
        type: 'listener',
        order: null
    },
    {
        method: 'GET',
        urlPattern: '/this/is/my/topic',
        type: 'listener',
        order: ''
    },
    {
        method: 'GET',
        urlPattern: '/this/is/my/topic',
        type: 'listener',
        order: 'bob'
    },
    {
        method: 'GET',
        urlPattern: '/this/is/my/topic',
        type: 'listener',
        order: 'in'
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
        type: 'listener',
        order: 'in',
        callback: ''
    },
    {
        method: 'GET',
        urlPattern: '/this/is/my/topic',
        type: 'listener',
        order: 'in',
        callback: {}
    },
    {
        method: 'GET',
        urlPattern: '/this/is/my/topic',
        type: 'listener',
        order: 'in',
        callback: {}
    },
    {
        method: 'GET',
        urlPattern: '/this/is/my/topic',
        type: 'listener',
        order: 'in',
        callback: {
            path: null
        }
    },
    {
        method: 'GET',
        urlPattern: '/this/is/my/topic',
        type: 'listener',
        order: 'in',
        callback: {
            path: ''
        }
    },
    {
        method: 'GET',
        urlPattern: '/this/is/my/topic',
        type: 'listener',
        order: 'in',
        callback: {
            path: '',
            func: null
        }
    },
    {
        method: 'GET',
        urlPattern: '/this/is/my/topic',
        type: 'listener',
        order: 'in',
        callback: {
            path: '',
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
                    constants.hookOrders.map(expandStringToLowerAndUpperCase).forEach(function (orderSet) {
                        orderSet.forEach(function (order) {
                            validHookCallbackValues.forEach(function (callback) {
                                var hook = {
                                    method: method,
                                    urlPattern: '/',
                                    type: type,
                                    order: order,
                                    callback: callback
                                };
                                hooks.push(hook);
                            });
                        });
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

function validateSingleHooksIsSet(hooks, urlPattern, method, order, type) {
    var methodHooks = hooks.get(method);
    methodHooks.should.be.an.Object.and.should.not.be.empty;
    methodHooks.should.have.property('hooks');
    methodHooks.hooks.should.be.an.instanceof(Array).with.lengthOf(1);
    methodHooks.hooks[0].urlPatternString.should.equal(urlPattern);
    methodHooks.hooks[0].method.should.equal(method);
    methodHooks.hooks[0].type.should.equal(type);
    methodHooks.hooks[0].order.should.equal(order);
}

function validateHookInvoke(done, method, order, type) {
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
        order: order,
        type: type,
        callback: function (hookContext, complete) {
            try {
                hookContext.should.have.properties([ 'request', 'response' ]);
                hookContext.request.should.have.properties([ 'method', 'url', 'query', 'headers', 'content' ]);
                hookContext.request.method.should.equal(method);
                hookContext.request.url.should.have.property('path');
                hookContext.request.url.path.should.equal(url);
                hookContext.request.headers.should.eql(headers);
                hookContext.request.content.should.equal(data);
                hookContext.response.should.have.property('responses');
                hookContext.response.responses.should.be.an.Array;
                hookContext.response.responses.should.be.empty;
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

function validatePreResponderHookSuccessBeforeInResponderHookInvoke(done, method) {
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
        order: 'pre',
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
                hookContext.response.should.have.property('responses');
                hookContext.response.responses.should.be.an.Array;
                hookContext.response.responses.should.be.empty;
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
        order: 'in',
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
                hookContext.response.should.have.property('responses');
                hookContext.response.responses.should.be.an.Array;
                hookContext.response.responses.should.be.empty;
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
            httpContext.response.should.have.property('responses');
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

function validatePostResponderHookSuccessAfterInResponderHookInvoke(done, method) {
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
        order: 'in',
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
                hookContext.response.should.have.property('responses');
                hookContext.response.responses.should.be.an.Array;
                hookContext.response.responses.should.be.empty;
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
        order: 'post',
        type: 'responder',
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
                    hookContext.response.should.have.property('responses');
                    hookContext.response.responses.should.be.an.Array;
                    hookContext.response.responses.should.not.be.empty;
                    hookContext.response.responses.should.have.a.lengthOf(1);
                    var response = hookContext.response.responses[0];
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
            httpContext.response.should.have.property('responses');
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

function validatePreResponderHookFailureBeforeInResponderHookInvoke(done, method) {
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
        order: 'pre',
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
                hookContext.response.should.have.property('responses');
                hookContext.response.responses.should.be.an.Array;
                hookContext.response.responses.should.be.empty;
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
        order: 'in',
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
            httpContext.response.should.have.property('responses');
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

function validatePostResponderHookFailureAfterInResponderHookInvoke(done, method) {
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
        order: 'in',
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
                hookContext.response.should.have.property('responses');
                hookContext.response.responses.should.be.an.Array;
                hookContext.response.responses.should.be.empty;
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
        order: 'post',
        type: 'responder',
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
                    hookContext.response.should.have.property('responses');
                    hookContext.response.responses.should.be.an.Array;
                    hookContext.response.responses.should.not.be.empty;
                    hookContext.response.responses.should.have.a.lengthOf(1);
                    var response = hookContext.response.responses[0];
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
            httpContext.response.should.have.property('responses');
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

function validatePreResponderHookContinueBeforeInResponderHookInvoke(done, method) {
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
        order: 'pre',
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
                hookContext.response.should.have.property('responses');
                hookContext.response.responses.should.be.an.Array;
                hookContext.response.responses.should.be.empty;
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
        order: 'in',
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
                    hookContext.response.should.have.property('responses');
                    hookContext.response.responses.should.be.an.Array;
                    hookContext.response.responses.should.be.empty;
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
            httpContext.response.should.have.property('responses');
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

function validatePostResponderHookContinueAfterInResponderHookInvoke(done, method) {
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
        order: 'in',
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
                hookContext.response.should.have.property('responses');
                hookContext.response.responses.should.be.an.Array;
                hookContext.response.responses.should.be.empty;
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
        order: 'post',
        type: 'responder',
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
                    hookContext.response.should.have.property('responses');
                    hookContext.response.responses.should.be.an.Array;
                    hookContext.response.responses.should.not.be.empty;
                    hookContext.response.responses.should.have.a.lengthOf(1);
                    var response = hookContext.response.responses[0];
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
            httpContext.response.should.have.property('responses');
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

function validateMultipleInResponderHooksInvokeWithSuccessResponse(done, method) {
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
        order: 'in',
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
                hookContext.response.should.have.property('responses');
                hookContext.response.responses.should.be.an.Array;
                hookContext.response.responses.should.be.empty;
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
        order: 'in',
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
                hookContext.response.should.have.property('responses');
                hookContext.response.responses.should.be.an.Array;
                hookContext.response.responses.should.not.be.empty;
                hookContext.response.responses.should.have.a.lengthOf(1);
                hookContext.response.responses[0].should.include({
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
                httpContext.response.should.have.property('responses');
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
                'get', 'getListener', 'getPreListener', 'getInListener', 'getPostListener',
                'getResponder', 'getPreResponder', 'getInResponder', 'getPostResponder',
                'put', 'putListener', 'putPreListener', 'putInListener', 'putPostListener',
                'putResponder', 'putPreResponder', 'putInResponder', 'putPostResponder',
                'post', 'postListener', 'postPreListener', 'postInListener', 'postPostListener',
                'postResponder', 'postPreResponder', 'postInResponder', 'postPostResponder',
                'delete', 'deleteListener', 'deletePreListener', 'deleteInListener', 'deletePostListener',
                'deleteResponder', 'deletePreResponder', 'deleteInResponder', 'deletePostResponder',
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
                    error = true;
                }

                error.should.equal(false, 'Expected not to throw for item of type: ' + JSON.stringify(hook));
                validateSingleHooksIsSet(
                    httpHooks.hooks,
                    hook.urlPattern,
                    hook.method.toLowerCase(),
                    hook.order.toLowerCase(),
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
                    hook.order.toLowerCase(),
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
                    hook.order.toLowerCase(),
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

    describe('#get(value1, value2, value3, value4)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.get('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'get', 'in', 'responder');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.map(expandStringToLowerAndUpperCase).forEach(function (orderSet) {
                    orderSet.forEach(function (order) {
                        var httpHooks = new HttpHooks();
                        httpHooks.get('/', callback, order);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'get',
                            order.toLowerCase(),
                            'responder');
                    });
                });
            });
        });

        it('should not throw an error when the first four arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.map(expandStringToLowerAndUpperCase).forEach(function (orderSet) {
                    orderSet.forEach(function (order) {
                        constants.hookTypes.map(expandStringToLowerAndUpperCase).forEach(function (typeSet) {
                            typeSet.forEach(function (type) {
                                var httpHooks = new HttpHooks();
                                httpHooks.get('/', callback, order, type);
                                validateSingleHooksIsSet(
                                    httpHooks.hooks,
                                    '/',
                                    'get',
                                    order.toLowerCase(),
                                    type.toLowerCase());
                            });
                        });
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

        it('should throw an error when the first and second argument are valid and provided but the thrid is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.get('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof order);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the thrid is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidOrderValues.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.get('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + order + '\'');
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first, second and third argument are valid and provided but the fourth is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.forEach(function (order) {
                    invalidTypeValues.forEach(function (type) {
                        var error = false;
                        var httpHooks = new HttpHooks();
                        try {
                            httpHooks.get('/', callback, order, type);
                        } catch (e) {
                            error = true;
                        }

                        error.should.equal(true, 'Expected throw for item of type: \'' + type + '\'');
                        validateHooksCollectionIsEmpty(httpHooks.hooks);
                    });
                });
            });
        });

        it('should throw an error when the first, second and third argument are valid and provided but the fourth is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.forEach(function (order) {
                    nonStringTypes.forEach(function (type) {
                        var error = false;
                        var httpHooks = new HttpHooks();
                        try {
                            httpHooks.get('/', callback, order, type);
                        } catch (e) {
                            error = true;
                        }

                        error.should.equal(true, 'Expected throw for item of type: ' + typeof type);
                        validateHooksCollectionIsEmpty(httpHooks.hooks);
                    });
                });
            });
        });
    });

    describe('#put(value1, value2, value3, value4)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.put('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'put', 'in', 'responder');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.map(expandStringToLowerAndUpperCase).forEach(function (orderSet) {
                    orderSet.forEach(function (order) {
                        var httpHooks = new HttpHooks();
                        httpHooks.put('/', callback, order);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'put',
                            order.toLowerCase(),
                            'responder');
                    });
                });
            });
        });

        it('should not throw an error when the first four arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.map(expandStringToLowerAndUpperCase).forEach(function (orderSet) {
                    orderSet.forEach(function (order) {
                        constants.hookTypes.map(expandStringToLowerAndUpperCase).forEach(function (typeSet) {
                            typeSet.forEach(function (type) {
                                var httpHooks = new HttpHooks();
                                httpHooks.put('/', callback, order, type);
                                validateSingleHooksIsSet(
                                    httpHooks.hooks,
                                    '/',
                                    'put',
                                    order.toLowerCase(),
                                    type.toLowerCase());
                            });
                        });
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

        it('should throw an error when the first and second argument are valid and provided but the thrid is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.put('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof order);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the thrid is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidOrderValues.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.put('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + order + '\'');
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first, second and third argument are valid and provided but the fourth is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.forEach(function (order) {
                    invalidTypeValues.forEach(function (type) {
                        var error = false;
                        var httpHooks = new HttpHooks();
                        try {
                            httpHooks.put('/', callback, order, type);
                        } catch (e) {
                            error = true;
                        }

                        error.should.equal(true, 'Expected throw for item of type: \'' + type + '\'');
                        validateHooksCollectionIsEmpty(httpHooks.hooks);
                    });
                });
            });
        });

        it('should throw an error when the first, second and third argument are valid and provided but the fourth is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.forEach(function (order) {
                    nonStringTypes.forEach(function (type) {
                        var error = false;
                        var httpHooks = new HttpHooks();
                        try {
                            httpHooks.put('/', callback, order, type);
                        } catch (e) {
                            error = true;
                        }

                        error.should.equal(true, 'Expected throw for item of type: ' + typeof type);
                        validateHooksCollectionIsEmpty(httpHooks.hooks);
                    });
                });
            });
        });
    });

    describe('#post(value1, value2, value3, value4)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.post('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'post', 'in', 'responder');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.map(expandStringToLowerAndUpperCase).forEach(function (orderSet) {
                    orderSet.forEach(function (order) {
                        var httpHooks = new HttpHooks();
                        httpHooks.post('/', callback, order);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'post',
                            order.toLowerCase(),
                            'responder');
                    });
                });
            });
        });

        it('should not throw an error when the first four arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.map(expandStringToLowerAndUpperCase).forEach(function (orderSet) {
                    orderSet.forEach(function (order) {
                        constants.hookTypes.map(expandStringToLowerAndUpperCase).forEach(function (typeSet) {
                            typeSet.forEach(function (type) {
                                var httpHooks = new HttpHooks();
                                httpHooks.post('/', callback, order, type);
                                validateSingleHooksIsSet(
                                    httpHooks.hooks,
                                    '/',
                                    'post',
                                    order.toLowerCase(),
                                    type.toLowerCase());
                            });
                        });
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

        it('should throw an error when the first and second argument are valid and provided but the thrid is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.post('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof order);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the thrid is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidOrderValues.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.post('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + order + '\'');
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first, second and third argument are valid and provided but the fourth is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.forEach(function (order) {
                    invalidTypeValues.forEach(function (type) {
                        var error = false;
                        var httpHooks = new HttpHooks();
                        try {
                            httpHooks.post('/', callback, order, type);
                        } catch (e) {
                            error = true;
                        }

                        error.should.equal(true, 'Expected throw for item of type: \'' + type + '\'');
                        validateHooksCollectionIsEmpty(httpHooks.hooks);
                    });
                });
            });
        });

        it('should throw an error when the first, second and third argument are valid and provided but the fourth is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.forEach(function (order) {
                    nonStringTypes.forEach(function (type) {
                        var error = false;
                        var httpHooks = new HttpHooks();
                        try {
                            httpHooks.post('/', callback, order, type);
                        } catch (e) {
                            error = true;
                        }

                        error.should.equal(true, 'Expected throw for item of type: ' + typeof type);
                        validateHooksCollectionIsEmpty(httpHooks.hooks);
                    });
                });
            });
        });
    });

    describe('#delete(value1, value2, value3, value4)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.delete('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'delete', 'in', 'responder');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.map(expandStringToLowerAndUpperCase).forEach(function (orderSet) {
                    orderSet.forEach(function (order) {
                        var httpHooks = new HttpHooks();
                        httpHooks.delete('/', callback, order);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'delete',
                            order.toLowerCase(),
                            'responder');
                    });
                });
            });
        });

        it('should not throw an error when the first four arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.map(expandStringToLowerAndUpperCase).forEach(function (orderSet) {
                    orderSet.forEach(function (order) {
                        constants.hookTypes.map(expandStringToLowerAndUpperCase).forEach(function (typeSet) {
                            typeSet.forEach(function (type) {
                                var httpHooks = new HttpHooks();
                                httpHooks.delete('/', callback, order, type);
                                validateSingleHooksIsSet(
                                    httpHooks.hooks,
                                    '/',
                                    'delete',
                                    order.toLowerCase(),
                                    type.toLowerCase());
                            });
                        });
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

        it('should throw an error when the first and second argument are valid and provided but the thrid is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.delete('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof order);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the thrid is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidOrderValues.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.delete('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + order + '\'');
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first, second and third argument are valid and provided but the fourth is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.forEach(function (order) {
                    invalidTypeValues.forEach(function (type) {
                        var error = false;
                        var httpHooks = new HttpHooks();
                        try {
                            httpHooks.delete('/', callback, order, type);
                        } catch (e) {
                            error = true;
                        }

                        error.should.equal(true, 'Expected throw for item of type: \'' + type + '\'');
                        validateHooksCollectionIsEmpty(httpHooks.hooks);
                    });
                });
            });
        });

        it('should throw an error when the first, second and third argument are valid and provided but the fourth is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.forEach(function (order) {
                    nonStringTypes.forEach(function (type) {
                        var error = false;
                        var httpHooks = new HttpHooks();
                        try {
                            httpHooks.delete('/', callback, order, type);
                        } catch (e) {
                            error = true;
                        }

                        error.should.equal(true, 'Expected throw for item of type: ' + typeof type);
                        validateHooksCollectionIsEmpty(httpHooks.hooks);
                    });
                });
            });
        });
    });

    describe('#getListener(value1, value2, value3)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.getListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'get', 'in', 'listener');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.map(expandStringToLowerAndUpperCase).forEach(function (orderSet) {
                    orderSet.forEach(function (order) {
                        var httpHooks = new HttpHooks();
                        httpHooks.getListener('/', callback, order);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'get',
                            order.toLowerCase(),
                            'listener');
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

        it('should throw an error when the first and second argument are valid and provided but the thrid is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.getListener('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof order);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the thrid is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidOrderValues.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.getListener('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + order + '\'');
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
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'put', 'in', 'listener');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.map(expandStringToLowerAndUpperCase).forEach(function (orderSet) {
                    orderSet.forEach(function (order) {
                        var httpHooks = new HttpHooks();
                        httpHooks.putListener('/', callback, order);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'put',
                            order.toLowerCase(),
                            'listener');
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

        it('should throw an error when the first and second argument are valid and provided but the thrid is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.putListener('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof order);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the thrid is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidOrderValues.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.putListener('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + order + '\'');
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
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'post', 'in', 'listener');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.map(expandStringToLowerAndUpperCase).forEach(function (orderSet) {
                    orderSet.forEach(function (order) {
                        var httpHooks = new HttpHooks();
                        httpHooks.postListener('/', callback, order);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'post',
                            order.toLowerCase(),
                            'listener');
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

        it('should throw an error when the first and second argument are valid and provided but the thrid is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.postListener('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof order);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the thrid is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidOrderValues.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.postListener('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + order + '\'');
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
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'delete', 'in', 'listener');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.map(expandStringToLowerAndUpperCase).forEach(function (orderSet) {
                    orderSet.forEach(function (order) {
                        var httpHooks = new HttpHooks();
                        httpHooks.deleteListener('/', callback, order);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'delete',
                            order.toLowerCase(),
                            'listener');
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

        it('should throw an error when the first and second argument are valid and provided but the thrid is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.deleteListener('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof order);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the thrid is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidOrderValues.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.deleteListener('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + order + '\'');
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
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'get', 'in', 'responder');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.map(expandStringToLowerAndUpperCase).forEach(function (orderSet) {
                    orderSet.forEach(function (order) {
                        var httpHooks = new HttpHooks();
                        httpHooks.getResponder('/', callback, order);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'get',
                            order.toLowerCase(),
                            'responder');
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

        it('should throw an error when the first and second argument are valid and provided but the thrid is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.getResponder('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof order);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the thrid is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidOrderValues.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.getResponder('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + order + '\'');
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
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'put', 'in', 'responder');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.map(expandStringToLowerAndUpperCase).forEach(function (orderSet) {
                    orderSet.forEach(function (order) {
                        var httpHooks = new HttpHooks();
                        httpHooks.putResponder('/', callback, order);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'put',
                            order.toLowerCase(),
                            'responder');
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

        it('should throw an error when the first and second argument are valid and provided but the thrid is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.putResponder('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof order);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the thrid is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidOrderValues.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.putResponder('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + order + '\'');
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
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'post', 'in', 'responder');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.map(expandStringToLowerAndUpperCase).forEach(function (orderSet) {
                    orderSet.forEach(function (order) {
                        var httpHooks = new HttpHooks();
                        httpHooks.postResponder('/', callback, order);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'post',
                            order.toLowerCase(),
                            'responder');
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

        it('should throw an error when the first and second argument are valid and provided but the thrid is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.postResponder('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof order);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the thrid is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidOrderValues.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.postResponder('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + order + '\'');
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
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'delete', 'in', 'responder');
            });
        });

        it('should not throw an error when the first three arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                constants.hookOrders.map(expandStringToLowerAndUpperCase).forEach(function (orderSet) {
                    orderSet.forEach(function (order) {
                        var httpHooks = new HttpHooks();
                        httpHooks.deleteResponder('/', callback, order);
                        validateSingleHooksIsSet(
                            httpHooks.hooks,
                            '/',
                            'delete',
                            order.toLowerCase(),
                            'responder');
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

        it('should throw an error when the first and second argument are valid and provided but the thrid is of an invalid type', function () {
            validHookCallbackValues.forEach(function (callback) {
                nonStringTypes.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.deleteResponder('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: ' + typeof order);
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });

        it('should throw an error when the first and second argument are valid and provided but the thrid is invalid', function () {
            validHookCallbackValues.forEach(function (callback) {
                invalidOrderValues.forEach(function (order) {
                    var error = false;
                    var httpHooks = new HttpHooks();
                    try {
                        httpHooks.deleteResponder('/', callback, order);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(true, 'Expected throw for item of type: \'' + order + '\'');
                    validateHooksCollectionIsEmpty(httpHooks.hooks);
                });
            });
        });
    });

    describe('#getPreListener(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.getPreListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'get', 'pre', 'listener');
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
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'put', 'pre', 'listener');
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
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'post', 'pre', 'listener');
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
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'delete', 'pre', 'listener');
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

    describe('#getInListener(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.getInListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'get', 'in', 'listener');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.getInListener();
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
                        httpHooks.getInListener(urlPattern, callback);
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
                httpHooks.getInListener('/');
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
                    httpHooks.getInListener('/', callback);
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
                    httpHooks.getInListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#putInListener(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.putInListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'put', 'in', 'listener');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.putInListener();
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
                        httpHooks.putInListener(urlPattern, callback);
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
                httpHooks.putInListener('/');
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
                    httpHooks.putInListener('/', callback);
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
                    httpHooks.putInListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#postInListener(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.postInListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'post', 'in', 'listener');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.postInListener();
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
                        httpHooks.postInListener(urlPattern, callback);
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
                httpHooks.postInListener('/');
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
                    httpHooks.postInListener('/', callback);
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
                    httpHooks.postInListener('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#deleteInListener(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.deleteInListener('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'delete', 'in', 'listener');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.deleteInListener();
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
                        httpHooks.deleteInListener(urlPattern, callback);
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
                httpHooks.deleteInListener('/');
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
                    httpHooks.deleteInListener('/', callback);
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
                    httpHooks.deleteInListener('/', callback);
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
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'get', 'post', 'listener');
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
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'put', 'post', 'listener');
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
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'post', 'post', 'listener');
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
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'delete', 'post', 'listener');
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

    describe('#getPreResponder(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.getPreResponder('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'get', 'pre', 'responder');
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
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'put', 'pre', 'responder');
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
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'post', 'pre', 'responder');
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
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'delete', 'pre', 'responder');
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

    describe('#getInResponder(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.getInResponder('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'get', 'in', 'responder');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.getInResponder();
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
                        httpHooks.getInResponder(urlPattern, callback);
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
                httpHooks.getInResponder('/');
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
                    httpHooks.getInResponder('/', callback);
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
                    httpHooks.getInResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#putInResponder(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.putInResponder('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'put', 'in', 'responder');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.putInResponder();
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
                        httpHooks.putInResponder(urlPattern, callback);
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
                httpHooks.putInResponder('/');
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
                    httpHooks.putInResponder('/', callback);
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
                    httpHooks.putInResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#postInResponder(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.postInResponder('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'post', 'in', 'responder');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.postInResponder();
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
                        httpHooks.postInResponder(urlPattern, callback);
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
                httpHooks.postInResponder('/');
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
                    httpHooks.postInResponder('/', callback);
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
                    httpHooks.postInResponder('/', callback);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + callback ? JSON.stringify(callback) : typeof callback);
                validateHooksCollectionIsEmpty(httpHooks.hooks);
            });
        });
    });

    describe('#deleteInResponder(value1, value2)', function () {
        it('should not throw an error when the first two arguments are passed and are valid', function () {
            validHookCallbackValues.forEach(function (callback) {
                var httpHooks = new HttpHooks();
                httpHooks.deleteInResponder('/', callback);
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'delete', 'in', 'responder');
            });
        });

        it('should throw an error when no arguments are provided', function () {
            var error = false;
            var httpHooks = new HttpHooks();
            try {
                httpHooks.deleteInResponder();
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
                        httpHooks.deleteInResponder(urlPattern, callback);
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
                httpHooks.deleteInResponder('/');
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
                    httpHooks.deleteInResponder('/', callback);
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
                    httpHooks.deleteInResponder('/', callback);
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
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'get', 'post', 'responder');
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
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'put', 'post', 'responder');
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
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'post', 'post', 'responder');
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
                validateSingleHooksIsSet(httpHooks.hooks, '/', 'delete', 'post', 'responder');
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
            validateHookInvoke(done, 'GET', 'pre', 'listener');
        });

        it('should find and invoke the defined hook for a GET in-listener', function (done) {
            validateHookInvoke(done, 'GET', 'in', 'listener');
        });

        it('should find and invoke the defined hook for a GET post-listener', function (done) {
            validateHookInvoke(done, 'GET', 'post', 'listener');
        });

        it('should find and invoke the defined hook for a PUT pre-listener', function (done) {
            validateHookInvoke(done, 'PUT', 'pre', 'listener');
        });

        it('should find and invoke the defined hook for a PUT in-listener', function (done) {
            validateHookInvoke(done, 'PUT', 'in', 'listener');
        });

        it('should find and invoke the defined hook for a PUT post-listener', function (done) {
            validateHookInvoke(done, 'PUT', 'post', 'listener');
        });

        it('should find and invoke the defined hook for a POST pre-listener', function (done) {
            validateHookInvoke(done, 'POST', 'pre', 'listener');
        });

        it('should find and invoke the defined hook for a POST in-listener', function (done) {
            validateHookInvoke(done, 'POST', 'in', 'listener');
        });

        it('should find and invoke the defined hook for a POST post-listener', function (done) {
            validateHookInvoke(done, 'POST', 'post', 'listener');
        });

        it('should find and invoke the defined hook for a DELETE pre-listener', function (done) {
            validateHookInvoke(done, 'DELETE', 'pre', 'listener');
        });

        it('should find and invoke the defined hook for a DELETE in-listener', function (done) {
            validateHookInvoke(done, 'DELETE', 'in', 'listener');
        });

        it('should find and invoke the defined hook for a DELETE post-listener', function (done) {
            validateHookInvoke(done, 'DELETE', 'post', 'listener');
        });

        it('should find and invoke the defined hook for a GET pre-responder', function (done) {
            validateHookInvoke(done, 'GET', 'pre', 'responder');
        });

        it('should find and invoke the defined hook for a GET in-responder', function (done) {
            validateHookInvoke(done, 'GET', 'in', 'responder');
        });

        it('should find and invoke the defined hook for a GET post-responder', function (done) {
            validateHookInvoke(done, 'GET', 'post', 'responder');
        });

        it('should find and invoke the defined hook for a PUT pre-responder', function (done) {
            validateHookInvoke(done, 'PUT', 'pre', 'responder');
        });

        it('should find and invoke the defined hook for a PUT in-responder', function (done) {
            validateHookInvoke(done, 'PUT', 'in', 'responder');
        });

        it('should find and invoke the defined hook for a PUT post-responder', function (done) {
            validateHookInvoke(done, 'PUT', 'post', 'responder');
        });

        it('should find and invoke the defined hook for a POST pre-responder', function (done) {
            validateHookInvoke(done, 'POST', 'pre', 'responder');
        });

        it('should find and invoke the defined hook for a POST in-responder', function (done) {
            validateHookInvoke(done, 'POST', 'in', 'responder');
        });

        it('should find and invoke the defined hook for a POST post-responder', function (done) {
            validateHookInvoke(done, 'POST', 'post', 'responder');
        });

        it('should find and invoke the defined hook for a DELETE pre-responder', function (done) {
            validateHookInvoke(done, 'DELETE', 'pre', 'responder');
        });

        it('should find and invoke the defined hook for a DELETE in-responder', function (done) {
            validateHookInvoke(done, 'DELETE', 'in', 'responder');
        });

        it('should find and invoke the defined hook for a DELETE post-responder', function (done) {
            validateHookInvoke(done, 'DELETE', 'post', 'responder');
        });

        it('should correcly invoke a GET pre-responder hook prior to an in-responder when there is a valid status code returned by the former', function (done) {
            validatePreResponderHookSuccessBeforeInResponderHookInvoke(done, 'GET');
        });

        it('should correcly invoke a PUT pre-responder hook prior to an in-responder when there is a valid status code returned by the former', function (done) {
            validatePreResponderHookSuccessBeforeInResponderHookInvoke(done, 'PUT');
        });

        it('should correcly invoke a POST pre-responder hook prior to an in-responder when there is a valid status code returned by the former', function (done) {
            validatePreResponderHookSuccessBeforeInResponderHookInvoke(done, 'POST');
        });

        it('should correcly invoke a DELETE pre-responder hook prior to an in-responder when there is a valid status code returned by the former', function (done) {
            validatePreResponderHookSuccessBeforeInResponderHookInvoke(done, 'DELETE');
        });

        it('should correcly respond to a GET request with a post-responder hook after an in-responder when there is a valid status code returned by the former', function (done) {
            validatePostResponderHookSuccessAfterInResponderHookInvoke(done, 'GET');
        });

        it('should correcly respond to a PUT request with a post-responder hook after an in-responder when there is a valid status code returned by the former', function (done) {
            validatePostResponderHookSuccessAfterInResponderHookInvoke(done, 'PUT');
        });

        it('should correcly respond to a POST request with a post-responder hook after an in-responder when there is a valid status code returned by the former', function (done) {
            validatePostResponderHookSuccessAfterInResponderHookInvoke(done, 'POST');
        });

        it('should correcly respond to a DELETE request with a post-responder hook after an in-responder when there is a valid status code returned by the former', function (done) {
            validatePostResponderHookSuccessAfterInResponderHookInvoke(done, 'DELETE');
        });

        it('should correcly invoke a GET pre-responder hook but not an in-responder when there is an invalid status code returned by the latter', function (done) {
            validatePreResponderHookFailureBeforeInResponderHookInvoke(done, 'GET');
        });

        it('should correcly invoke a PUT pre-responder hook but not an in-responder when there is an invalid status code returned by the latter', function (done) {
            validatePreResponderHookFailureBeforeInResponderHookInvoke(done, 'PUT');
        });

        it('should correcly invoke a POST pre-responder hook but not an in-responder when there is an invalid status code returned by the latter', function (done) {
            validatePreResponderHookFailureBeforeInResponderHookInvoke(done, 'POST');
        });

        it('should correcly invoke a DELETE pre-responder hook but not an in-responder when there is an invalid status code returned by the latter', function (done) {
            validatePreResponderHookFailureBeforeInResponderHookInvoke(done, 'DELETE');
        });

        it('should correcly respond to a GET request with a post-responder hook after an in-responder when there is an invalid status code returned by the former', function (done) {
            validatePostResponderHookFailureAfterInResponderHookInvoke(done, 'GET');
        });

        it('should correcly respond to a PUT request with a post-responder hook after an in-responder when there is an invalid status code returned by the former', function (done) {
            validatePostResponderHookFailureAfterInResponderHookInvoke(done, 'PUT');
        });

        it('should correcly respond to a POST request with a post-responder hook after an in-responder when there is an invalid status code returned by the former', function (done) {
            validatePostResponderHookFailureAfterInResponderHookInvoke(done, 'POST');
        });

        it('should correcly respond to a DELETE request with a post-responder hook after an in-responder when there is an invalid status code returned by the former', function (done) {
            validatePostResponderHookFailureAfterInResponderHookInvoke(done, 'DELETE');
        });

        it('should correcly invoke a GET pre-responder hook prior to an in-responder when there is a continue status code returned by the former', function (done) {
            validatePreResponderHookContinueBeforeInResponderHookInvoke(done, 'GET');
        });

        it('should correcly invoke a PUT pre-responder hook prior to an in-responder when there is a continue status code returned by the former', function (done) {
            validatePreResponderHookContinueBeforeInResponderHookInvoke(done, 'PUT');
        });

        it('should correcly invoke a POST pre-responder hook prior to an in-responder when there is a continue status code returned by the former', function (done) {
            validatePreResponderHookContinueBeforeInResponderHookInvoke(done, 'POST');
        });

        it('should correcly invoke a DELETE pre-responder hook prior to an in-responder when there is a continue status code returned by the former', function (done) {
            validatePreResponderHookContinueBeforeInResponderHookInvoke(done, 'DELETE');
        });

        it('should correcly respond to a GET request with a post-responder hook after an in-responder when there is a continue status code returned by the former', function (done) {
            validatePostResponderHookContinueAfterInResponderHookInvoke(done, 'GET');
        });

        it('should correcly respond to a PUT request with a post-responder hook after an in-responder when there is a continue status code returned by the former', function (done) {
            validatePostResponderHookContinueAfterInResponderHookInvoke(done, 'PUT');
        });

        it('should correcly respond to a POST request with a post-responder hook after an in-responder when there is a continue status code returned by the former', function (done) {
            validatePostResponderHookContinueAfterInResponderHookInvoke(done, 'POST');
        });

        it('should correcly respond to a DELETE request with a post-responder hook after an in-responder when there is a continue status code returned by the former', function (done) {
            validatePostResponderHookContinueAfterInResponderHookInvoke(done, 'DELETE');
        });

        it('should correcly respond to a GET request with multiple in-responder hooks returning a successful status code', function (done) {
            validateMultipleInResponderHooksInvokeWithSuccessResponse(done, 'GET');
        });

        it('should correcly respond to a PUT request with multiple in-responder hooks returning a successful status code', function (done) {
            validateMultipleInResponderHooksInvokeWithSuccessResponse(done, 'PUT');
        });

        it('should correcly respond to a POST request with multiple in-responder hooks returning a successful status code', function (done) {
            validateMultipleInResponderHooksInvokeWithSuccessResponse(done, 'POST');
        });

        it('should correcly respond to a DELETE request with multiple in-responder hooks returning a successful status code', function (done) {
            validateMultipleInResponderHooksInvokeWithSuccessResponse(done, 'DELETE');
        });
    });
});
